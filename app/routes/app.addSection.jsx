import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { Button, TextField, Form, Page, Select, BlockStack, Toast, Frame } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import db from '../db.server';

// Main action function to handle form submission and section creation
export const action = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("title");
  const price = parseFloat(formData.get("price"));
  const features = formData.getAll("features"); // Get multiple features
  const imageUrl = formData.get("imageUrl");
  const template = formData.get("template");
  const categoryId = formData.get("categoryId");

  const section = await db.section.create({
    data: {
      title,
      price,
      features: features.join(", "), // Store features as a comma-separated string or array depending on schema
      imageUrl,
      template,
      category: {
        connect: { id: categoryId },
      },
    },
  });

  return json({ success: true, section });
};



// Component for adding sections
export default function AddSectionPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState([""]); // Start with an empty feature input
  const [imageUrl, setImageUrl] = useState("");
  const [template, setTemplate] = useState("all");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const submit = useSubmit();
  const data = useActionData();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  // Fetch categories for the select input
  useEffect(() => {
    async function fetchCategories() {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit(
      {
        title,
        price,
        features, // Send the array of features
        imageUrl,
        template,
        categoryId,
      },
      { replace: true, method: "POST" }
    );
  };

  // Handle feature input changes
  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = value;
    setFeatures(updatedFeatures);
  };

  // Add a new feature input field
  const addFeatureField = () => {
    setFeatures([...features, ""]); // Add an empty feature to the array
  };

  // Remove a feature input field
  const removeFeatureField = (index) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    setFeatures(updatedFeatures);
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
        <div className="add-section-container">
          <Form noValidate onSubmit={handleSubmit}>
            <TextField
              label="Section Title"
              type="text"
              onChange={setTitle}
              value={title}
              required
            />
            <TextField
              label="Price"
              type="number"
              step="0.01"
              onChange={setPrice}
              value={price}
              required
            />

            {/* Dynamic feature inputs */}
            <BlockStack vertical>
              {features.map((feature, index) => (
                <BlockStack key={index}>
                  <TextField
                    label={`Feature ${index + 1}`}
                    type="text"
                    value={feature}
                    onChange={(value) => handleFeatureChange(index, value)}
                  />
                  <Button onClick={() => removeFeatureField(index)} plain destructive>
                    Remove Feature
                  </Button>
                </BlockStack>
              ))}
            </BlockStack>

            <Button onClick={addFeatureField}>Add Another Feature</Button>

            <TextField
              label="Image URL"
              type="text"
              onChange={setImageUrl}
              value={imageUrl}
            />
            <Select
              label="Template"
              options={[
                { label: "All", value: "all" },
                { label: "Index", value: "index" },
                { label: "Product", value: "product" },
                { label: "Article", value: "article" },
                { label: "Cart", value: "cart" },
                { label: "Collection", value: "collection" },
                { label: "Blog", value: "blog" },
              ]}
              onChange={setTemplate}
              value={template}
              required
            />
            <Select
              label="Category"
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              onChange={setCategoryId}
              value={categoryId}
              required
            />
            <Button submit>Create Section</Button>
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
