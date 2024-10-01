import React, { useState, useEffect } from "react";
import {  useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const assset = new admin.rest.resources.Asset({session:session});
    assset.theme_id = 139881250994;
    assset.key = "section/new_Section.liquid";
    assset.value = "sourav's new section";
    await assset.save({
        update:true,
    });
    console.log(assset);

  return null;
};

// Component for adding categories
export default function Theme() {
    return (
        <>
        hello world 
        </>
    );
}
