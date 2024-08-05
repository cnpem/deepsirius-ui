"use client";
import SearchDialog from "fumadocs-ui/components/dialog/search-default";
import type { SharedProps } from "fumadocs-ui/components/dialog/search";

export default function CustomSearchDialog(props: SharedProps) {
  // hardcoded api path in the search dialog does not sees next basePath
  return <SearchDialog api="/dive/api/search" {...props} />;
}
