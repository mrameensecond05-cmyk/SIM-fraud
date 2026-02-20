
package ai.simtinel

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class FraudAnalysis(
    val riskScore: Int,
    val riskLevel: String,
    val reasoning: String,
    val category: String
)

class GeminiService(private val apiKey: String) {
    private val model = GenerativeModel(
        modelName = "gemini-3-flash-preview",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
        }
    )

    suspend fun analyzeSms(
        body: String, 
        imsiMatch: Boolean, 
        hoursSinceSwap: Int
    ): FraudAnalysis? {
        val prompt = """
            Analyze this SMS for fraud: "$body"
            Context: IMSI Match: $imsiMatch, SIM Swap: $hoursSinceSwap hours ago.
            Return JSON with riskScore (0-100), riskLevel (LOW, MEDIUM, HIGH, CRITICAL), 
            reasoning, and category.
        """.trimIndent()

        return try {
            val response = model.generateContent(prompt)
            response.text?.let { Json.decodeFromString<FraudAnalysis>(it) }
        } catch (e: Exception) {
            null
        }
    }
}
