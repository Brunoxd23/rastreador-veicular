"use client";

import TicketDetalhes from "./TicketDetalhes";
import React from "react";

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <TicketDetalhes id={id} />;
}
