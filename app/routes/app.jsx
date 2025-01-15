import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];


export const loader = async ({ request }) => {
  const { session, redirect } = await authenticate.admin(request);
  const shop = session.shop;
  if (shop == process.env.MAIN_SHOP) {
    return json({ apiKey: process.env.SHOPIFY_API_KEY || "", admin: true });
  }else{
    return json({ apiKey: process.env.SHOPIFY_API_KEY || "", admin: false });
  }
};


export default function App() {
  const { apiKey,admin } = useLoaderData();
  
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/PurchasedSections">My Sections</Link>
        <Link to="/app/Tutorial">Tutorial</Link>
        {admin && <Link to="/app/admin">Admin</Link>}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
