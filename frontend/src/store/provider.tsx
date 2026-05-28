"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./store";
import { hydrateAuth } from "./authSlice";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState(makeStore);

  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
