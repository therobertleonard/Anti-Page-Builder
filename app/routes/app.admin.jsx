import React, { useState, useEffect } from "react";
import {
  Page,
  Card,
  DataTable,
  Thumbnail,
  Button,
  Frame,
  Toast,
  Modal,
  List,
  Grid,
  Image,
  BlockStack,
  InlineStack,
  Icon,
  InlineGrid,
  Text,
  TextField
} from "@shopify/polaris";
import { redirect, useNavigate } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export let action = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const sectionId = formData.get('sectionId');

  if (sectionId) {
    try {
      await prisma.section.delete({
        where: {
          id: sectionId,
        },
      });
      return redirect('/app/adminIndex');
    } catch (error) {
      console.error('Error deleting section:', error);
      return { error: 'Failed to delete section.' };
    }
  }
  return { error: 'Section ID is required.' };
};

export default function AdminIndex() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [password, setPassword] = useState("");  // Track entered password
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Track if user is authenticated

  // Define the password (this can be environment-specific or dynamic in a real-world scenario)
  const predefinedPassword = "#admin32";

  useEffect(() => {
    if (isAuthenticated) {
      async function fetchSections() {
        const response = await fetch("/api/sections");
        const data = await response.json();
        setSections(data.sections);
      }
      fetchSections();
    }
  }, [isAuthenticated]);

  // Handle password submission
  const handlePasswordSubmit = () => {
    if (password === predefinedPassword) {
      setIsAuthenticated(true);
      setToastMessage("Successfully authenticated!");
      setShowToast(true);
    } else {
      setToastMessage("Incorrect password. Please try again.");
      setShowToast(true);
    }
  };

  // Handle delete section
  const handleDelete = async () => {
    if (!sectionToDelete) return;

    // Prepare form data for the action
    const formData = new URLSearchParams();
    formData.append("sectionId", sectionToDelete.id);

    try {
      const response = await fetch('/app/adminIndex', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSections((prevSections) =>
          prevSections.filter((section) => section.id !== sectionToDelete.id)
        );
        setToastMessage("Section deleted successfully.");
        setShowToast(true);
      } else {
        setToastMessage("Failed to delete section.");
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage("An error occurred while deleting the section.");
      setShowToast(true);
    } finally {
      setDeleteModal(false);
      setSectionToDelete(null);
    }
  };

  const handleAddSection = () => {
    return navigate("/app/addSection");
  }

  const handleAddCategory = () => {
    return navigate("/app/addCategory");
  }

  // Table rows
  const rows = sections.map((section) => [
    <Thumbnail
      source={section.imageUrl || "https://via.placeholder.com/100"}
      alt={section.title}
    />,
    section.title,
    `$${section.price.toFixed(2)}`,
    <Button
      primary
      onClick={() => {
        setSelectedSection(section); // Store selected section data
        setViewModal(true); // Show view modal
      }}
      variant="primary"
    >
      View
    </Button>,
    <Button
      destructive
      onClick={() => {
        setDeleteModal(true);
        setSectionToDelete(section);
      }}
      variant="primary"
      tone="critical"
    >
      Delete
    </Button>,
  ]);

  return (
    <Frame>
      {/* If user is not authenticated, show password form */}
      {!isAuthenticated ? (
        <Page title="Admin Authentication"
          backAction={{ content: "Home", url: "/app/" }}
        >
          <Card>
            <BlockStack gap={400}>
              <Text variant="headingLg">Please enter the password to access the admin page</Text>
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(value) => setPassword(value)}
              />
              <Button onClick={handlePasswordSubmit} variant="primary" >Submit</Button>
            </BlockStack>
          </Card>
        </Page>
      ) : (
        <Page title="Admin - Sections"
          primaryAction={<Button variant="primary" onClick={handleAddSection}>Add Section</Button>}
          secondaryActions={<Button onClick={handleAddCategory}>Add Category</Button>}
          backAction={{ content: "Home", url: "/app/" }}
        >
          <>
            {/* Main admin content */}
            <Card>
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Image", "Title", "Price", "View", "Delete"]}
                rows={rows}
              />
            </Card>

            {/* Toast for success/error messages */}
            {showToast && (
              <Toast
                content={toastMessage}
                onDismiss={() => setShowToast(false)}
              />
            )}

            {/* Modal for delete confirmation */}
            {deleteModal && (
              <Modal
                open={deleteModal}
                onClose={() => setDeleteModal(false)}
                title="Delete Section"
                primaryAction={{
                  content: "Delete",
                  onAction: handleDelete,
                  destructive: true,
                }}
                secondaryActions={[{
                  content: "Cancel",
                  onAction: () => setDeleteModal(false),
                }]}
              >
                <Modal.Section>
                  <p>Are you sure you want to delete the section "{sectionToDelete?.title}"?</p>
                </Modal.Section>
              </Modal>
            )}

            {/* Modal for viewing section details */}
            {viewModal && selectedSection && (
              <Modal
                open={viewModal}
                onClose={() => setViewModal(false)}
                title={selectedSection.title}
                primaryAction={{
                  content: "Close",
                  onAction: () => setViewModal(false),
                }}
                size="Large"
              >
                <Modal.Section>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 8, xl: 8 }}>
                      <Card title="Sales" sectioned>
                        <Image
                          source={selectedSection.imageUrl}
                          alt={selectedSection.title}
                          height="auto"
                          width="100%"
                        />
                      </Card>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
                      <BlockStack gap="500">
                        <Card roundedAbove="sm">
                          <BlockStack gap="200">
                            <InlineGrid columns="1fr auto">
                              <Text as="h2" variant="headingSm">
                                {selectedSection.title}
                              </Text>
                              <Text variant="bodyMd">Price: ${selectedSection.price}</Text>
                            </InlineGrid>
                            <Text variant="bodyMd">
                              <Text variant="headingMd" as="h2">Features:</Text>
                              <ul>
                                {selectedSection.features.split('|').map((feature, index) => (
                                  <li key={index}>{feature.trim()}</li>
                                ))}
                              </ul>
                            </Text>
                          </BlockStack>
                        </Card>
                      </BlockStack>
                    </Grid.Cell>
                  </Grid>
                </Modal.Section>
              </Modal>
            )}
          </>
        </Page>
      )}
    </Frame>
  );
}
