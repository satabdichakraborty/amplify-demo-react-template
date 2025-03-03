import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import "./App.css";

const client = generateClient<Schema>();

// Define a type for our Todo items
type TodoItem = {
  id: string;
  content: string;
  status?: string;
};

function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch todos
  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const response = await client.models.Todo.list();
      
      // Map the response to ensure all todos have a status
      const todosWithStatus = response.data.map(todo => ({
        ...todo,
        status: todo.status || "Pending" // Provide a default status if it's null
      }));
      
      setTodos(todosWithStatus);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError("Error loading todos. Please refresh the page.");
      setIsLoading(false);
    }
  };

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Create a new todo
  async function createTodo() {
    try {
      const content = window.prompt("Todo content");
      if (content) {
        await client.models.Todo.create({ 
          content,
          status: "Pending" // Always provide a valid status
        });
        // Fetch todos again to update the list
        fetchTodos();
      }
    } catch (error) {
      console.error("Error creating todo:", error);
      setError("Error creating todo. Please try again.");
    }
  }

  // Update a todo
  async function updateTodo(id: string, content: string) {
    try {
      await client.models.Todo.update({
        id,
        content,
        status: "Pending" // Always use a valid status
      });
      // Fetch todos again to update the list
      fetchTodos();
    } catch (error) {
      console.error("Error updating todo:", error);
      setError("Error updating todo. Please try again.");
    }
  }

  // Delete a todo
  async function deleteTodo(id: string) {
    try {
      await client.models.Todo.delete({ id });
      // Fetch todos again to update the list
      fetchTodos();
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError("Error deleting todo. Please try again.");
    }
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Todo App</h1>
        </header>
        <main className="app-content">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Todo App</h1>
        <button className="add-button" onClick={createTodo}>Add Todo</button>
      </header>
      
      <main className="app-content">
        {isLoading ? (
          <p className="loading">Loading todos...</p>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            <p>No todos yet. Create one to get started!</p>
            <button onClick={createTodo}>Add Todo</button>
          </div>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className="todo-item">
                <span className="todo-content">{todo.content}</span>
                <div className="todo-actions">
                  <button 
                    className="edit-button"
                    onClick={() => {
                      const currentContent = todo.content || "";
                      const newContent = window.prompt("Update todo content", currentContent);
                      if (newContent && todo.id) {
                        updateTodo(todo.id, newContent);
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => todo.id && deleteTodo(todo.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
