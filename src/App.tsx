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
  Select,
  SpaceBetween,
  Table,
  TextFilter,
  TopNavigation
} from "@cloudscape-design/components";
import "@cloudscape-design/global-styles/index.css";
import "./App.css";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [filterText, setFilterText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState({ label: "All", value: "all" });

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
        status: "Pending" 
      });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  function updateTodoStatus(id: string, status: string) {
    client.models.Todo.update({
      id,
      status
    });
  }

  // Filter todos based on search text and selected status
  const filteredTodos = todos.filter(todo => {
    const matchesText = todo.content?.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || todo.status === selectedStatus.value;
    return matchesText && matchesStatus;
  });

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Completed", value: "Completed" }
  ];

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
                <SpaceBetween direction="horizontal" size="s">
                  <TextFilter
                    filteringText={filterText}
                    filteringPlaceholder="Find todo"
                    onChange={({ detail }) => setFilterText(detail.filteringText)}
                  />
                  <Select
                    selectedOption={selectedStatus}
                    onChange={({ detail }) => setSelectedStatus(detail.selectedOption)}
                    options={statusOptions}
                  />
                </SpaceBetween>
                
                <Table
                  columnDefinitions={[
                    {
                      id: "id",
                      header: "ID",
                      cell: item => item.id.substring(0, 8) + "...",
                      sortingField: "id",
                      width: 120
                    },
                    {
                      id: "content",
                      header: "Content",
                      cell: item => item.content,
                      sortingField: "content"
                    },
                    {
                      id: "status",
                      header: "Status",
                      cell: item => (
                        <Select
                          selectedOption={{ label: item.status, value: item.status }}
                          onChange={({ detail }) => 
                            updateTodoStatus(item.id, detail.selectedOption.value as string)
                          }
                          options={statusOptions.filter(option => option.value !== 'all')}
                        />
                      ),
                      width: 200
                    },
                    {
                      id: "actions",
                      header: "Actions",
                      cell: item => (
                        <Button 
                          variant="link" 
                          onClick={() => deleteTodo(item.id)}
                        >
                          Delete
                        </Button>
                      ),
                      width: 100
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
