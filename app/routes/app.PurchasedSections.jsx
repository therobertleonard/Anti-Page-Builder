import { useActionData, useLoaderData } from "@remix-run/react";

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
import { Grid, Text, Page, Image, Modal, Box, Button, Banner, Toast, Card, Icon, BlockStack, InlineGrid, Badge, InlineStack, ButtonGroup, Frame } from "@shopify/polaris";
import {
    ViewIcon,
    PlusCircleIcon,
    ProductIcon
} from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@remix-run/react";
import { Form } from "@remix-run/react";
import fs from 'fs/promises';
import path from 'path';
import {ExternalIcon} from '@shopify/polaris-icons';

// Loader function to fetch purchased sections
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shopId = session.shop;

    // Step 1: Get section IDs from SectionPayment table
    const sectionPayments = await db.sectionPayment.findMany({
        where: {
            payment: {
                shopId: shopId,
            },
        },
    });

    // Extract section IDs
    const sectionIds = sectionPayments.map((sp) => sp.sectionId);

    // Step 2: Fetch sections matching the IDs from the Section table
    const purchasedSections = await db.section.findMany({
        where: {
            id: {
                in: sectionIds,
            },
        },
        include: {
            category: true,
        },
    });
    console.log(shopId);
    const match = shopId.match(/^([a-z0-9\-]+)\.myshopify\.com/);
    let storeName = null;

    if (match) {
        storeName = match[1];
    } else {
        console.log("Invalid shop URL format.");
    }


    return { purchasedSections, storeName: storeName };
};

export const action = async ({ request }) => {
    try {
        // Authenticate the admin session
        const { admin, session } = await authenticate.admin(request);
        const formData = await request.formData();
        const title = formData.get("title");
        const category = formData.get("category");
        const sanitizedTitle = title.replace(/\s+/g, '_');

        // Construct the file path without encoding
        const filePath = path.join(process.cwd(), 'app', 'Sections', category, `${title}.liquid`);

        // Read the file content
        const fileContent = await fs.readFile(filePath, 'utf-8');
        console.log('File Content:', fileContent);

        // Create a new asset object with the admin SDK
        const asset = new admin.rest.resources.Asset({
            session: session
        });

        const theme = await admin.rest.resources.Theme.all({
            session: session,
        })
        const mainTheme = theme.data.find(theme => theme.role === 'main');
        const ThemeId = mainTheme.id;

        // Set the theme ID and asset properties
        asset.theme_id = ThemeId; // Replace with your actual theme ID
        asset.key = `sections/APB_${title}.liquid`; // Adjust the key as needed
        asset.value = fileContent;

        // Save the asset to Shopify with update option
        await asset.save({ update: true });

        return { success: true, message: "Section added successfully!" };
    } catch (error) {
        console.error('Error in action:', error);

        // Log the detailed error response if available
        if (error.response && error.response.json) {
            const errorDetails = await error.response.json();
            console.error('Error Details:', errorDetails);
        }

        return { success: false, error: error.message || "Failed to add section." };
    }
};


export default function PurchasedSections() {
    const { purchasedSections, storeName } = useLoaderData();
    console.log(storeName);
    const sections = purchasedSections;
    const actionData = useActionData();
    const [activeSection, setActiveSection] = useState(null);
    const [activeToast, setActiveToast] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Function to open the modal with section details
    const handleOpenModal = (section) => {
        setActiveSection(section);
    };

    // Function to close the modal
    const handleCloseModal = () => {
        setActiveSection(null);
    };

    useEffect(() => {
        if (actionData) {
            if (actionData.success) {
                setActiveToast(true);
            } else {
                setError(actionData.error);
            }
        }
    }, [actionData]);

    const toggleToastActive = useCallback(() => setActiveToast((active) => !active), []);

    const toastMarkup = activeToast ? (
        <Toast content="Section added successfully!" onDismiss={toggleToastActive} />
    ) : null;

    return (
        <Frame>
            <Page fullWidth title="Sections" backAction={{ content: "Settings", url: "/app" }}
                secondaryActions={[
                    {
                        content: 'Customiation',
                        external:true,
                        icon: ExternalIcon,
                        onAction: () => { window.open(`https://admin.shopify.com/store/${storeName}/themes/current/editor`) }
                    }
                ]}>
                <Grid gap={200}>
                    {sections.length === 0 ? (
                        <Text>No sections available for purchase.</Text>
                    ) : (
                        sections.map((section) => (
                            <Grid.Cell key={section.id} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <Card padding="400">
                                    <Image
                                        source={section.imageUrl}
                                        alt="Card Image"
                                        height="150px"
                                        width="250px"
                                    />
                                    <Box padding="400">
                                        <Text variant="bodyMd">{section.title}</Text>
                                    </Box>
                                    <ButtonGroup>
                                        <Button onClick={() => handleOpenModal(section)}>
                                            Details
                                        </Button>
                                        <Form method="post">
                                            <input type="hidden" name="Sectionid" value={section.id} />
                                            <input type="hidden" name="title" value={section.title} />
                                            <input type="hidden" name="category" value={section.category.name} />
                                            <Button submit variant="primary" fullWidth>Add Section</Button>
                                        </Form>
                                    </ButtonGroup>
                                </Card>
                            </Grid.Cell>
                        ))
                    )}
                </Grid>

                {/* Modal for showing section details */}
                {activeSection && (
                    <Modal size="large"
                        open={Boolean(activeSection)}
                        onClose={handleCloseModal}
                        title={activeSection.title}
                        primaryAction={{
                            content: 'Close',
                            onAction: handleCloseModal,
                        }}
                    >
                        <Modal.Section>

                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 8, xl: 8 }}>
                                    <Card title="Sales" sectioned>
                                        <Image
                                            source={activeSection.imageUrl}
                                            alt={activeSection.title}
                                            height="auto"
                                            width="100%"
                                        />
                                        <Text variant="bodyMd">
                                            <Text variant="headingMd" as="h2">Features:</Text>
                                            <ul>
                                                {activeSection.features.split('|').map((feature, index) => (
                                                    <li key={index}>{feature.trim()}</li>
                                                ))}
                                            </ul>
                                        </Text>
                                    </Card>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
                                    <BlockStack gap="500">
                                        <Card roundedAbove="sm">
                                            <BlockStack gap="200">
                                                <InlineGrid columns="1fr auto">
                                                    <Text as="h2" variant="headingSm">
                                                        {activeSection.title}
                                                    </Text>
                                                    <Text variant="bodyMd">Price: ${activeSection.price}</Text>
                                                </InlineGrid>
                                                <div style={{ display: "inline-block" }}>
                                                    <Badge>{activeSection.category.name}</Badge>
                                                </div>
                                                <Button submit variant="primary" fullWidth disabled>PURCHASED</Button>
                                            </BlockStack>
                                        </Card>
                                        <Card sectioned>
                                            <InlineStack gap="400">
                                                <InlineStack wrap={false} gap="400">
                                                    <Icon
                                                        source={ProductIcon}
                                                        tone="base"
                                                    />
                                                    <Text variant="bodyMd">One-time charge (never recurring)</Text>
                                                </InlineStack>
                                                <InlineStack wrap={false} gap="400">
                                                    <Icon
                                                        source={PlusCircleIcon}
                                                        tone="base"
                                                    />
                                                    <Text variant="bodyMd">Add section to any theme</Text>
                                                </InlineStack>
                                            </InlineStack>
                                        </Card>
                                    </BlockStack>
                                </Grid.Cell>
                            </Grid>
                        </Modal.Section>
                    </Modal>
                )}

                {/* Toast notification */}
                {toastMarkup}

                {/* Error handling */}
                {error && (
                    <Toast content={error} onDismiss={() => setError("")} />
                )}
            </Page>
        </Frame>
    );
}
