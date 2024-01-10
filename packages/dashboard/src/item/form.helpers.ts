import React from "react";
import {UpdateCallbackType} from "./item.context";

export type FormProps = {
  children: (
    item: any,
    update: UpdateCallbackType<any>,
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  ) => React.ReactNode,
  context: React.Context<any>,
  name: string
}