import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { Button, TextField, Form, Page, Frame, Toast } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import db from '../db.server';

// Main action function to handle form submission and category creation
export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");

  const category = await db.category.create({
    data: {
      name,
      description,
    },
  });

  return json({ success: true, category });
};

// Component for adding categories
export default function AddCategory() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showToast, setShowToast] = useState(false); // State to control toast visibility
  const submit = useSubmit();
  const data = useActionData();

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit(
      {
        name,
        description,
      },
      { replace: true, method: "POST" }
    );
  };

  // Effect to show toast on successful submission
  useEffect(() => {
    if (data?.success) {
      setShowToast(true); // Show toast on success
    }
  }, [data]);

  return (
    <Frame>
      <Page>
        <div className="add-category-container">
          <Form noValidate onSubmit={handleSubmit}>
            <TextField
              label="Category Name"
              type="text"
              onChange={setName}
              value={name}
              required
            />
            <TextField
              label="Description"
              type="text"
              onChange={setDescription}
              value={description}
              required
            />
            <Button submit>Create Category</Button>
          </Form>
        </div>

        {/* Show toast when category is successfully created */}
        {showToast && (
          <Toast 
            content="Category created successfully!" 
            onDismiss={() => setShowToast(false)} // Hide toast on dismiss
          />
        )}
      </Page>
    </Frame>
  );
}
