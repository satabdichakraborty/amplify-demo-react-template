import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  AppLayout,
  Box,
  Button,
  Container,
  ContentLayout,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  TextFilter,
  TopNavigation
} from "@cloudscape-design/components";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import "@cloudscape-design/global-styles/index.css";
import "./App.css";

// Apply light mode to all Cloudscape components
applyMode(Mode.Light);

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ 
        content,
        status: "" // Provide an empty string for the status field
      });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  // Filter todos based on search text
  const filteredTodos = todos.filter(todo => 
    todo.content?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
      <TopNavigation
        identity={{
          href: "#",
          title: "Todo App"
        }}
        utilities={[]}
      />
      
      <AppLayout
        content={
          <ContentLayout
            header={
              <Header
                variant="h1"
                actions={
                  <Button variant="primary" onClick={createTodo}>
                    Add Item
                  </Button>
                }
              >
                Todo Items ({todos.length})
              </Header>
            }
          >
            <Container>
              <SpaceBetween size="l">
                <TextFilter
                  filteringText={filterText}
                  filteringPlaceholder="Find todo"
                  onChange={({ detail }) => setFilterText(detail.filteringText)}
                />
                
                <Table
                  columnDefinitions={[
                    {
                      id: "id",
                      header: "ID",
                      cell: item => item.id.substring(0, 8) + "...",
                      sortingField: "id",
                      width: 150
                    },
                    {
                      id: "content",
                      header: "Content",
                      cell: item => <div className="content-cell">{item.content}</div>,
                      sortingField: "content",
                      width: 400
                    },
                    {
                      id: "actions",
                      header: "Actions",
                      cell: item => (
                        <div className="action-buttons-container">
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button 
                              variant="normal" 
                              onClick={() => {
                                const currentContent = item.content || "";
                                const newContent = window.prompt("Update todo content", currentContent);
                                if (newContent) {
                                  client.models.Todo.update({
                                    id: item.id,
                                    content: newContent,
                                    status: item.status || "" // Preserve the status field
                                  });
                                }
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="primary" 
                              onClick={() => deleteTodo(item.id)}
                            >
                              Delete
                            </Button>
                          </SpaceBetween>
                        </div>
                      ),
                      width: 250
                    }
                  ]}
                  items={filteredTodos}
                  loadingText="Loading todos"
                  selectionType="single"
                  trackBy="id"
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No todos</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        No todos to display.
                      </Box>
                      <Button onClick={createTodo}>Add todo</Button>
                    </Box>
                  }
                  header={<Header>Todo Items</Header>}
                />
                
                <Pagination
                  currentPageIndex={currentPageIndex}
                  onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                  pagesCount={Math.max(1, Math.ceil(filteredTodos.length / 10))}
                />
              </SpaceBetween>
            </Container>
          </ContentLayout>
        }
        navigationHide
        toolsHide
      />
    </div>
  );
}

export default App;
