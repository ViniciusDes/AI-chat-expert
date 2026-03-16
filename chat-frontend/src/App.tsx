import "./App.css";
import { ChatBox } from "./components/ChatBot";

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">Chat</h1>
      </header>
      <ChatBox />
    </main>
  );
}

export default App;
