using System.Collections.Concurrent;
using System.Net.WebSockets;
using SysWebSocket = System.Net.WebSockets.WebSocket;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CrmApi.Services.WebSocket
{
    /// <summary>
    /// Manages active WebSocket connections for chat messaging.
    /// Simple in‑memory manager sufficient for development/testing.
    /// </summary>
    public class WebSocketConnectionManager
    {
        private readonly ConcurrentDictionary<int, SysWebSocket> _sockets = new();

        /// <summary>
        /// Adds a new socket for a given user id. If a socket already exists for the user, it is replaced.
        /// </summary>
        public void Add(int userId, SysWebSocket socket)
        {
            if (_sockets.TryGetValue(userId, out var existing))
            {
                if (existing.State == WebSocketState.Open)
                {
                    _ = existing.CloseAsync(WebSocketCloseStatus.NormalClosure, "Replaced by new connection", CancellationToken.None);
                }
                existing.Dispose();
            }
            _sockets[userId] = socket;
        }

        public bool TryGetConnection(int userId, out SysWebSocket? socket)
        {
            return _sockets.TryGetValue(userId, out socket);
        }

        public void Remove(int userId)
        {
            if (_sockets.TryRemove(userId, out var ws))
            {
                if (ws.State == WebSocketState.Open)
                {
                    _ = ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Removed", CancellationToken.None);
                }
                ws.Dispose();
            }
        }

        /// <summary>
        /// Removes the socket associated with the user id.
        /// </summary>
        public async Task RemoveAsync(int userId)
        {
            if (_sockets.TryRemove(userId, out var ws))
            {
                if (ws.State == WebSocketState.Open)
                {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Removed", CancellationToken.None);
                }
                ws.Dispose();
            }
        }

        /// <summary>
        /// Retrieves the socket for the specified user, or null if not connected.
        /// </summary>
        public SysWebSocket? Get(int userId) => _sockets.TryGetValue(userId, out var ws) ? ws : null;

        /// <summary>
        /// Sends a text message to a specific user if their socket is open.
        /// </summary>
        public async Task SendAsync(int userId, string message)
        {
            var ws = Get(userId);
            if (ws == null || ws.State != WebSocketState.Open) return;
            var bytes = Encoding.UTF8.GetBytes(message);
            await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }

        /// <summary>
        /// Broadcasts a text message to all connected users.
        /// </summary>
        public async Task BroadcastAsync(string message)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            foreach (var kvp in _sockets)
            {
                var ws = kvp.Value;
                if (ws.State == WebSocketState.Open)
                {
                    await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        }
    }
}
