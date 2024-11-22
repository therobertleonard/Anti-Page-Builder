import { useLoaderData, useActionData, Form, redirect, useNavigate } from "@remix-run/react";
import { Grid, Text, Page, Image, Modal, Box, Button, Banner, Card, Icon, BlockStack, InlineGrid, Badge, InlineStack } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import {
  ViewIcon,
  PlusCircleIcon,
  ProductIcon
} from '@shopify/polaris-icons';
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Loader function to fetch sections that have not been purchased
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Fetch the IDs of purchased sections for the current shop
  const purchasedSectionIds = await db.sectionPayment.findMany({
    where: {
      payment: {
        shopId: shopDomain,
      },
    },
    select: {
      sectionId: true,
    },
  }).then(payments => payments.map(payment => payment.sectionId));

  // Fetch sections that have not been purchased
  const sections = await db.section.findMany({
    where: {
      NOT: {
        id: {
          in: purchasedSectionIds,
        },
      },
    },
    include: {
      category: true,
    },
  });

  return sections;
};

// Action function to create ApplicationCharge
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const Sectionid = formData.get("Sectionid");
  const title = formData.get("title");
  const price = parseFloat(formData.get("price"));
  const shopDomain = session.shop;
  const appHandle = "anti-page-builder";
  const returnUrl = `https://${shopDomain}/admin/apps/${appHandle}/app/confirmPayment?shop=${shopDomain}&sectionID=${Sectionid}`;
  const applicationCharge = new admin.rest.resources.ApplicationCharge({
    session: session,
  });

  applicationCharge.name = `Purchase ${title}`;
  applicationCharge.price = price;
  applicationCharge.return_url = returnUrl;
  applicationCharge.test = true;

  await applicationCharge.save({ update: true });

  return { success: true, confirmationUrl: applicationCharge.confirmation_url };
};

export default function Index() {
  const sections = useLoaderData();
  const actionData = useActionData();
  const [activeSection, setActiveSection] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  console.log(sections[0].features)

  // Function to open the modal with section details
  const handleOpenModal = (section) => {
    setActiveSection(section);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setActiveSection(null);
  };

  // Effect to handle action result
  useEffect(() => {
    if (actionData?.success) {
      setShowBanner(true);
      setError("");

      // Redirect to the confirmation URL
      window.parent.location.href = actionData.confirmationUrl;
    } else if (actionData?.error) {
      setError(actionData.error);
      setShowBanner(false);
    }
  }, [actionData]);

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
                      <Text variant="headingMd" as="h2">Feature:</Text>
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
                        {/* Form to handle payment */}
                        <Form method="post">
                          <input type="hidden" name="Sectionid" value={activeSection.id} />
                          <input type="hidden" name="title" value={activeSection.title} />
                          <input type="hidden" name="price" value={activeSection.price} />
                          <Button submit variant="primary" fullWidth>Buy Section</Button>
                        </Form>
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
                    {/* <Card sectioned>
                      <Button icon={ViewIcon} fullWidth>VIEW DEMO</Button>
                    </Card> */}

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
