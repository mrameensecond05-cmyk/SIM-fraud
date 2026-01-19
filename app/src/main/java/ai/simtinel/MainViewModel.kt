
package ai.simtinel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object LoggedOut : AuthState()
    data class LoggedIn(val userName: String, val email: String) : AuthState()
}

data class Alert(
    val id: String,
    val sender: String,
    val message: String,
    val score: Int,
    val level: String,
    val timestamp: String
)

class MainViewModel : ViewModel() {
    private val _authState = MutableStateFlow<AuthState>(AuthState.LoggedOut)
    val authState: StateFlow<AuthState> = _authState

    private val _alerts = MutableStateFlow<List<Alert>>(emptyList())
    val alerts: StateFlow<List<Alert>> = _alerts

    private val _safetyScore = MutableStateFlow(94)
    val safetyScore: StateFlow<Int> = _safetyScore

    fun login(email: String, name: String) {
        _authState.value = AuthState.LoggedIn(name, email)
    }

    fun logout() {
        _authState.value = AuthState.LoggedOut
    }

    fun addAlert(alert: Alert) {
        _alerts.value = listOf(alert) + _alerts.value
    }
}
