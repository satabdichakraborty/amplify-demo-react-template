import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import "./App.css";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;
    
    const fetchTodos = async () => {
      try {
        // First, try to get all todos
        const result = await client.models.Todo.list();
        setTodos(result.data || []);
        
        // Then set up the subscription for real-time updates
        subscription = client.models.Todo.observeQuery().subscribe({
          next: (data) => {
            setTodos(data?.items || []);
            setIsLoading(false);
          },
          error: (err) => {
            console.error("Error in subscription:", err);
            setError("Error loading todos. Please refresh the page.");
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error("Error fetching todos:", err);
        setError("Error loading todos. Please refresh the page.");
        setIsLoading(false);
      }
    };
    
    fetchTodos();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  async function createTodo() {
    try {
      const content = window.prompt("Todo content");
      if (content) {
        await client.models.Todo.create({ 
          content,
          status: "Pending" // Always provide a valid status
        });
      }
    } catch (error) {
      console.error("Error creating todo:", error);
      setError("Error creating todo. Please try again.");
    }
  }

  async function deleteTodo(id: string) {
    try {
      if (id) {
        await client.models.Todo.delete({ id });
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError("Error deleting todo. Please try again.");
    }
  }

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
                      if (todo?.id) {
                        const currentContent = todo.content || "";
                        const newContent = window.prompt("Update todo content", currentContent);
                        if (newContent) {
                          try {
                            client.models.Todo.update({
                              id: todo.id,
                              content: newContent,
                              status: "Pending" // Always use a valid status
                            });
                          } catch (error) {
                            console.error("Error updating todo:", error);
                            setError("Error updating todo. Please try again.");
                          }
                        }
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
