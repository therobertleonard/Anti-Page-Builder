import React, { useState } from "react";
import { Page, Layout, Grid, MediaCard, Modal, Button, Text, Link } from "@shopify/polaris";

// Sample image imports (replace these paths with actual screenshot URLs or paths)
import Install from './assets/Install.png';
import purchaseSection from './assets/PayforSection.png';
import paymentProcess from './assets/PurchaseSection.png';
import addSection from './assets/AddSection.png';
import searchAPB from './assets/SectionAdded.png';
import finalView from './assets/Section.png';

export default function Index() {
  const [activeModal, setActiveModal] = useState(false);

  const toggleModal = () => setActiveModal((prev) => !prev);

  return (
    <Page fullWidth title="Tutorial" backAction={{ content: "Settings", url: "/app/" }}>
      <Layout>
        <Layout.Section>
          <Grid>
            {/* Step 1 - Install the App */}
            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <MediaCard
                portrait
                title="1. Install the App"
                description="Start by installing the app from the Shopify App Store. Once installed, click on the 'Install' button to get started."
              >
                <img
                  alt="Install the App"
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  src={Install}
                />
              </MediaCard>
            </Grid.Cell>

            {/* Step 2 - Click on a Section to Purchase */}
            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <MediaCard
                portrait
                title="2. Click on a Section to Purchase"
                description="Choose any section you want to purchase, and click on the 'Purchase' button to proceed."
              >
                <img
                  alt="Purchase Section"
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  src={purchaseSection}
                />
              </MediaCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            {/* Step 3 - Complete Payment */}
            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <MediaCard
                portrait
                title="3. Complete Payment"
                description="Finish your payment process and then click on 'My Sections' to view your purchased section."
              >
                <img
                  alt="Payment Process"
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  src={paymentProcess}
                />
              </MediaCard>
            </Grid.Cell>

            {/* Step 4 - Add Section to Customization */}
            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <MediaCard
                portrait
                title="4. Add Section to Customization"
                description="Click on 'Add Section' to add the section to your customization. Then, click on 'Customization' to view the section."
              >
                <img
                  alt="Add Section"
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  src={addSection}
                />
              </MediaCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            {/* Step 5 - Search for APB Sections */}
            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <MediaCard
                portrait
                title="5. Search for APB Sections"
                description="In the customization panel, click on 'Add Section' and use the search bar to type 'APB'. All sections associated with the app will appear."
              >
                <img
                  alt="Search for APB Sections"
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  src={searchAPB}
                />
              </MediaCard>
            </Grid.Cell>

            {/* Step 7 - Final View of Section */}
            <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <MediaCard
                portrait
                title="7. View Your Customized Section"
                description="Once you've added and customized the section, you can view the final version on your store."
              >
                <img
                  alt="Final View of Section"
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  src={finalView}
                />
              </MediaCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
