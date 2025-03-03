import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import "./App.css";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const subscription = client.models.Todo.observeQuery().subscribe({
        next: (data) => {
          setTodos(data?.items || []);
          setIsLoading(false);
        },
        error: (error) => {
          console.error("Error fetching todos:", error);
          setIsLoading(false);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up subscription:", error);
      setIsLoading(false);
    }
  }, []);

  async function createTodo() {
    try {
      const content = window.prompt("Todo content");
      if (content) {
        await client.models.Todo.create({ 
          content,
          status: "" // Provide an empty string for the status field
        });
      }
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  }

  async function deleteTodo(id: string) {
    try {
      if (id) {
        await client.models.Todo.delete({ id });
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Todo App</h1>
        <button className="add-button" onClick={createTodo}>Add Todo</button>
      </header>
      
      <main className="app-content">
        {isLoading ? (
          <p>Loading todos...</p>
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
                              status: todo.status || ""
                            });
                          } catch (error) {
                            console.error("Error updating todo:", error);
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
