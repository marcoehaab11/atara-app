package com.marcoehab.attarsort

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.SnapshotsClient
import com.google.android.gms.games.snapshot.Snapshot
import com.google.android.gms.games.snapshot.SnapshotContents
import com.google.android.gms.games.snapshot.SnapshotMetadataChange
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

@CapacitorPlugin(name = "PlayGames")
class PlayGamesPlugin : Plugin() {
    @PluginMethod
    fun isAuthenticated(call: PluginCall) {
        PlayGames.getGamesSignInClient(activity).isAuthenticated
            .addOnSuccessListener { result -> call.resolve(JSObject().put("authenticated", result.isAuthenticated)) }
            .addOnFailureListener { call.resolve(JSObject().put("authenticated", false)) }
    }

    @PluginMethod
    fun loadSnapshot(call: PluginCall) {
        runIfAuthenticated(call, { call.resolve(JSObject().put("data", null)) }) {
            val client = PlayGames.getSnapshotsClient(activity)
            client.open(SNAPSHOT_NAME, true, SnapshotsClient.RESOLUTION_POLICY_MANUAL)
                .addOnSuccessListener { result ->
                    val conflict = result.conflict
                    if (result.isConflict) {
                        if (conflict == null) call.reject("Unable to read saved progress conflict")
                        else resolveConflict(client, conflict, call, null, 0)
                    }
                    else {
                        val snapshot = result.data
                        if (snapshot == null) { call.reject("Saved progress is unavailable"); return@addOnSuccessListener }
                        val data = try { snapshot.snapshotContents.readFully().toString(Charsets.UTF_8).ifEmpty { null } }
                        catch (error: Exception) { client.discardAndClose(snapshot); call.reject("Unable to read saved progress", error); return@addOnSuccessListener }
                        client.discardAndClose(snapshot).addOnCompleteListener {
                            call.resolve(JSObject().put("data", data))
                        }
                    }
                }
                .addOnFailureListener { error -> call.reject("Unable to load saved progress", error) }
        }
    }

    @PluginMethod
    fun saveSnapshot(call: PluginCall) {
        val data = call.getString("data")
        if (data == null) { call.reject("Missing save data"); return }
        runIfAuthenticated(call, { call.resolve() }) {
            val client = PlayGames.getSnapshotsClient(activity)
            client.open(SNAPSHOT_NAME, true, SnapshotsClient.RESOLUTION_POLICY_MANUAL)
                .addOnSuccessListener { result ->
                    val conflict = result.conflict
                    if (result.isConflict) {
                        if (conflict == null) call.reject("Unable to read saved progress conflict")
                        else resolveConflict(client, conflict, call, data, 0)
                    } else {
                        val snapshot = result.data
                        if (snapshot == null) call.reject("Saved progress is unavailable")
                        else writeAndCommit(client, snapshot, data, call)
                    }
                }
                .addOnFailureListener { error -> call.reject("Unable to open saved progress", error) }
        }
    }

    @PluginMethod
    fun unlockAchievement(call: PluginCall) {
        val key = call.getString("key")
        val resourceName = ACHIEVEMENTS[key]
        if (resourceName == null) { call.reject("Unknown achievement"); return }
        val resourceId = context.resources.getIdentifier(resourceName, "string", context.packageName)
        val achievementId = if (resourceId == 0) "" else context.getString(resourceId)
        if (achievementId.isBlank() || achievementId.startsWith("REPLACE_")) { call.resolve(); return }
        PlayGames.getAchievementsClient(activity).unlockImmediate(achievementId)
            .addOnSuccessListener { call.resolve() }
            .addOnFailureListener { error -> call.reject("Unable to unlock achievement", error) }
    }

    @PluginMethod
    fun showAchievements(call: PluginCall) {
        val signIn = PlayGames.getGamesSignInClient(activity)
        signIn.isAuthenticated
            .addOnSuccessListener { result ->
                if (result.isAuthenticated) showAchievementsUi(call)
                else signIn.signIn().addOnSuccessListener { signedIn ->
                    if (signedIn.isAuthenticated) showAchievementsUi(call) else call.resolve()
                }.addOnFailureListener { call.resolve() }
            }
            .addOnFailureListener { call.resolve() }
    }

    private fun showAchievementsUi(call: PluginCall) {
        PlayGames.getAchievementsClient(activity).achievementsIntent
            .addOnSuccessListener { intent -> activity.startActivity(intent); call.resolve() }
            .addOnFailureListener { error -> call.reject("Play Games achievements are not available", error) }
    }

    private fun runIfAuthenticated(call: PluginCall, unauthenticated: () -> Unit, operation: () -> Unit) {
        PlayGames.getGamesSignInClient(activity).isAuthenticated
            .addOnSuccessListener { result -> if (result.isAuthenticated) operation() else unauthenticated() }
            .addOnFailureListener { unauthenticated() }
    }

    private fun writeAndCommit(client: SnapshotsClient, snapshot: Snapshot, data: String, call: PluginCall) {
        try {
            if (!snapshot.snapshotContents.writeBytes(data.toByteArray(Charsets.UTF_8))) {
                client.discardAndClose(snapshot)
                call.reject("Unable to write saved progress")
                return
            }
            val metadata = SnapshotMetadataChange.Builder().setDescription("Attar Sort progress").build()
            client.commitAndClose(snapshot, metadata)
                .addOnSuccessListener { call.resolve() }
                .addOnFailureListener { error -> call.reject("Unable to save progress", error) }
        } catch (error: Exception) {
            client.discardAndClose(snapshot)
            call.reject("Unable to write saved progress", error)
        }
    }

    private fun resolveConflict(
        client: SnapshotsClient,
        conflict: SnapshotsClient.SnapshotConflict,
        call: PluginCall,
        localData: String?,
        attempt: Int,
    ) {
        if (attempt >= MAX_CONFLICT_RETRIES) { call.reject("Saved progress changed on another device; retry later"); return }
        try {
            val cloudData = conflict.snapshot.snapshotContents.readFully().toString(Charsets.UTF_8)
            val competingData = conflict.conflictingSnapshot.snapshotContents.readFully().toString(Charsets.UTF_8)
            val merged = when {
                localData != null -> mergeSaveJson(localData, mergeSaveJson(cloudData, competingData))
                else -> mergeSaveJson(cloudData, competingData)
            }
            val resolution: SnapshotContents = conflict.resolutionSnapshotContents
            if (!resolution.writeBytes(merged.toByteArray(Charsets.UTF_8))) {
                call.reject("Unable to prepare saved progress conflict resolution")
                return
            }
            val metadata = SnapshotMetadataChange.Builder().setDescription("Attar Sort progress").build()
            client.resolveConflict(conflict.conflictId, conflict.snapshot.metadata.snapshotId, metadata, resolution)
                .addOnSuccessListener { result ->
                    val nextConflict = result.conflict
                    if (result.isConflict) {
                        if (nextConflict == null) { call.reject("Unable to read saved progress conflict"); return@addOnSuccessListener }
                        resolveConflict(client, nextConflict, call, localData, attempt + 1)
                    } else {
                        val opened = result.data
                        if (opened == null) { call.reject("Saved progress is unavailable"); return@addOnSuccessListener }
                        val resolvedData = try { opened.snapshotContents.readFully().toString(Charsets.UTF_8) }
                        catch (_: Exception) { merged }
                        client.discardAndClose(opened).addOnCompleteListener {
                            if (localData == null) call.resolve(JSObject().put("data", resolvedData)) else call.resolve()
                        }
                    }
                }
                .addOnFailureListener { error -> call.reject("Unable to resolve saved progress conflict", error) }
        } catch (error: Exception) {
            call.reject("Unable to read saved progress conflict", error)
        }
    }

    private fun mergeSaveJson(firstText: String, secondText: String): String {
        if (firstText.isBlank()) return secondText
        if (secondText.isBlank()) return firstText
        return try {
            val first = JSONObject(firstText)
            val second = JSONObject(secondText)
            val firstLevel = first.optInt("maxLevel", 0)
            val secondLevel = second.optInt("maxLevel", 0)
            val preferred = when {
                secondLevel > firstLevel -> second
                secondLevel < firstLevel -> first
                totalStars(second) > totalStars(first) -> second
                else -> first
            }
            val merged = JSONObject(preferred.toString())
            val owned = JSONArray()
            val seen = linkedSetOf<String>()
            listOf(first.optJSONArray("owned"), second.optJSONArray("owned")).forEach { values ->
                if (values != null) for (index in 0 until values.length()) values.optString(index).takeIf { it.isNotBlank() }?.let(seen::add)
            }
            seen.forEach(owned::put)
            merged.put("owned", owned)
            merged.toString()
        } catch (_: JSONException) { if (firstText.isNotBlank()) firstText else secondText }
    }

    private fun totalStars(player: JSONObject): Int {
        val stars = player.optJSONObject("stars") ?: return 0
        val keys = stars.keys()
        var total = 0
        while (keys.hasNext()) total += stars.optInt(keys.next(), 0)
        return total
    }

    companion object {
        private const val SNAPSHOT_NAME = "attar-sort-progress-v1"
        private const val MAX_CONFLICT_RETRIES = 3
        private val ACHIEVEMENTS = mapOf(
            "first_three_star" to "pgs_achievement_first_three_star",
            "levels_50" to "pgs_achievement_levels_50",
            "levels_100" to "pgs_achievement_levels_100",
            "streak_7" to "pgs_achievement_streak_7",
            "orders_20" to "pgs_achievement_orders_20",
            "all_decorations" to "pgs_achievement_all_decorations",
        )
    }
}
