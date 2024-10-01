import { useLoaderData } from "@remix-run/react";
import db from '../db.server';
import { Grid, Text, Page, Image, Modal, Box, Button, Banner, Card, Icon, BlockStack, InlineGrid, Badge, InlineStack } from "@shopify/polaris";
import {
    ViewIcon,
    PlusCircleIcon,
    ProductIcon
} from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";

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
            category: true, // Include category information if needed
        },
    });

    return purchasedSections;
};

export default function PurchasedSections() {
    const sections = useLoaderData();
    const [activeSection, setActiveSection] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
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


    return (
        <>
            <Page fullWidth title="Sections" backAction={{ content: "Settings", url: "/app" }}>
                <Grid gap={200}>
                    {sections.length === 0 ? (
                        <Text>No sections available for purchase.</Text>
                    ) : (
                        sections.map((section) => (
                            <Grid.Cell key={section.id} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <Button onClick={() => handleOpenModal(section)}>
                                    <Image
                                        source={section.imageUrl}
                                        alt="Card Image"
                                        height="150px"
                                        width="250px"
                                    />
                                    <Box padding="400">
                                        <Text variant="bodyMd">{section.title}</Text>
                                    </Box>
                                </Button>
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
                                        <Card sectioned>
                                            <Button icon={ViewIcon} fullWidth>VIEW DEMO</Button>
                                        </Card>

                                    </BlockStack>
                                </Grid.Cell>
                            </Grid>
                        </Modal.Section>
                    </Modal>
                )}

                {/* Banner for success or error messages */}
                {showBanner && (
                    <Banner status="success" onDismiss={() => setShowBanner(false)}>
                        Charge created successfully!
                    </Banner>
                )}
                {error && (
                    <Banner status="critical" onDismiss={() => setError("")}>
                        {error}
                    </Banner>
                )}
            </Page>
        </>
    );
}
