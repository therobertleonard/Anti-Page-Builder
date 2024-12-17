import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import {
  Button,
  TextField,
  Form,
  Page,
  Select,
  BlockStack,
  Toast,
  Frame,
  InlineError,
  FormLayout,
  Text,
  InlineStack,
  Box,
  ButtonGroup,
  Card,
  DropZone,
  LegacyStack,
  Thumbnail,
} from "@shopify/polaris";
import {
  DeleteIcon, PlusCircleIcon, NoteIcon
} from '@shopify/polaris-icons';
import { useNavigate } from "react-router-dom";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main action function to handle form submission and section creation
export const action = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("title");
  const price = parseFloat(formData.get("price"));
  const features = formData.getAll("features"); // Get multiple features
  const imageUrl = formData.get("imageUrl");
  const template = formData.get("template");
  const categoryId = formData.get("categoryId");
  const uploadedFile = formData.get("file"); // Get the uploaded file

  // Get the category details
  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return json({ success: false, error: "Invalid category" });
  }

  // Validate and sanitize the title
  const sanitizedTitle = title.replace(/\s+/g, "_"); // Replace spaces with underscores

  // Validate file extension
  const fileExtension = path.extname(uploadedFile.name);
  if (![".liquid", ".json"].includes(fileExtension)) {
    return json({
      success: false,
      error: "Invalid file type. Only .liquid and .json files are allowed.",
    });
  }

  // Construct the directory path: sections/{category}
  const categoryDirectory = path.join(__dirname, "../Sections", category.name);

  // Check if category directory exists, if not, create it
  try {
    await fs.access(categoryDirectory);
  } catch (err) {
    // Directory doesn't exist, create it
    await fs.mkdir(categoryDirectory, { recursive: true });
  }

  // Construct the file path: sections/{category}/{sanitized_title}.liquid
  const filePath = path.join(categoryDirectory, `${sanitizedTitle}${fileExtension}`);

  // Check if the file already exists to avoid overwriting
  try {
    await fs.access(filePath); // If this doesn't throw, the file exists
    return json({
      success: false,
      error: "A file with this name already exists. Please choose a different title.",
    });
  } catch (err) {
    // File does not exist, proceed to write it
    const fileContents = await uploadedFile.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileContents));
  }

  // Save the section to the database
  const section = await db.section.create({
    data: {
      title,
      price,
      features: features.join(" | "), // Use a pipe as the separator
      imageUrl,
      template,
      category: {
        connect: { id: categoryId },
      },
    },
  });

  return json({ success: true, section });
};

export default function AddSectionPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [template, setTemplate] = useState("all");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const submit = useSubmit();
  const data = useActionData();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setCategoryId(data[0].id); // Set default to the first category
      }
    }
    fetchCategories();
  }, []);

  // Validation logic
  const validate = () => {
    const newErrors = {};

    if (!title) {
      newErrors.title = "Title is required.";
    } else if (/\s/.test(title)) {
      newErrors.title = "Title cannot contain spaces.";
    }

    if (!price || isNaN(price) || price <= 0) {
      newErrors.price = "Price must be a valid number greater than zero.";
    }

    features.forEach((feature, index) => {
      if (!feature.trim()) {
        newErrors[`feature-${index}`] = `Feature ${index + 1} is required.`;
      } else if (feature.length < 50 || feature.length > 150) {
        newErrors[`feature-${index}`] = `Feature ${index + 1} must be between 50-150 characters.`;
      }
    });

    if (!imageUrl) {
      newErrors.imageUrl = "Image URL is required.";
    } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/.test(imageUrl)) {
      newErrors.imageUrl = "Image URL must be a valid image URL ending in a proper image extension (e.g., .jpg, .png).";
    }


    if (!categoryId) {
      newErrors.categoryId = "Category is required.";
    }

    if (!file) {
      newErrors.file = "File upload is required.";
    } else if (![".liquid", ".json"].includes(file.name.slice(file.name.lastIndexOf(".")))) {
      newErrors.file = "File must be a .liquid or .json file.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    features.forEach((feature) => formData.append("features", feature));
    formData.append("imageUrl", imageUrl);
    formData.append("template", template);
    formData.append("categoryId", categoryId);
    formData.append("file", file);

    await submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" });
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = value;
    setFeatures(updatedFeatures);
  };

  const addFeatureField = () => setFeatures([...features, ""]);
  const removeFeatureField = (index) => setFeatures(features.filter((_, i) => i !== index));

  useEffect(() => {
    if (data?.success) {
      setShowToast(true);
      navigate("/app/");
    }
  }, [data]);

  return (
    <Frame>
      <Page title="Add Section" backAction={{ content: "Home", url: "/app/admin" }}>
        <Card>
          <Form noValidate onSubmit={handleSubmit}>
            <BlockStack vertical gap={200}>
              {data?.error && (
                <Banner status="critical" title="Submission Error">
                  <Text>{data.error}</Text>
                </Banner>
              )}

              <TextField
                label="Section Title"
                value={title}
                onChange={setTitle}
                error={errors.title}
                required
              />

              <FormLayout.Group>

                <TextField
                  label="Price"
                  value={price}
                  onChange={setPrice}
                  type="number"
                  error={errors.price}
                  required
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
                  value={template}
                  onChange={setTemplate}
                />

                <Select
                  label="Category"
                  options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
                  value={categoryId}
                  onChange={setCategoryId}
                  error={errors.categoryId}
                  required
                />
              </FormLayout.Group>
              <BlockStack vertical>
                <Text>Features</Text>
                {features.map((feature, index) => (
                  <InlineStack key={index} alignment="center" gap={300}>
                    <Box width="90%">
                      <TextField
                        value={feature}
                        onChange={(value) => handleFeatureChange(index, value)}
                        error={errors[`feature-${index}`]}
                      /></Box>

                    <Box width="3%">
                      <Button onClick={() => removeFeatureField(index)}
                        destructive
                        icon={DeleteIcon}
                        variant="primary"
                        tone="critical">
                      </Button>
                    </Box>

                    <Box width="3%" >
                      <Button onClick={addFeatureField}
                        destructive
                        icon={PlusCircleIcon}
                        variant="primary">
                      </Button>
                    </Box>
                  </InlineStack>
                ))}
              </BlockStack>

              <TextField
                label="Image URL"
                value={imageUrl}
                onChange={setImageUrl}
                error={errors.imageUrl}
              />
              <DropZone
                onDrop={(_dropFiles, acceptedFiles) => setFile(acceptedFiles[0])}
                accept=".liquid, .json"
                type="file"
                error={errors.file}
              >
                {file ? (
                  <LegacyStack vertical>
                    <LegacyStack alignment="center">
                      <Thumbnail
                        size="small"
                        alt={file.name}
                        source={
                          ['.liquid', '.json'].includes(file.name.slice(-6)) ? NoteIcon : NoteIcon
                        }
                      />
                      <div>
                        {file.name}
                        <Text variant="bodySm" as="p">
                          {file.size} bytes
                        </Text>
                      </div>
                    </LegacyStack>
                  </LegacyStack>
                ) : (
                  <DropZone.FileUpload />
                )}
              </DropZone>
              {errors.file && <InlineError message={errors.file} />}
              <Button submit variant="primary">
                Create Section
              </Button>
            </BlockStack>
          </Form>
        </Card>

        {showToast && (
          <Toast content="Section created successfully!" onDismiss={() => setShowToast(false)} />
        )}
      </Page>
    </Frame>
  );
}
