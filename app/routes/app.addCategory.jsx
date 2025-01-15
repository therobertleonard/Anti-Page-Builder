import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { Button, TextField, Form, Page, Frame, Toast, Card, BlockStack } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

import { PrismaClient } from "@prisma/client";
import { authenticate } from "../shopify.server";
const db = new PrismaClient();


export const loader = async ({ request }) => {
  const {session,redirect} = await authenticate.admin(request);
  const shop = session.shop;
  if(shop !== process.env.MAIN_SHOP){
    return redirect(/app/);
  }
  return null;
};

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
  const [errors, setErrors] = useState({});

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};

    if (!name) {
      errors.name = "Category Name is required.";
    } else if (/\s/.test(name)) {
      errors.name = "Category Name cannot contain spaces.";
    }

    if (!description) {
      errors.description = "Description is required.";
    }

    // If there are validation errors, set them and exit
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

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
      <Page title="Add Section Category" backAction={{ content: "Home", url: "/app/admin" }}>
        <Card>
          <Form noValidate onSubmit={handleSubmit}>
            <BlockStack vertical gap={200}>
              <TextField
                label="Category Name"
                type="text"
                onChange={setName}
                value={name}
                error={errors.name}
                required
              />
              <TextField
                label="Description"
                type="text"
                onChange={setDescription}
                value={description}
                error={errors.description}
                required
              />
              <Button submit variant="primary">Create Category</Button>
            </BlockStack>
          </Form>

        </Card>

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
