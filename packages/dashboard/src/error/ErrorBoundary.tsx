import React from "react";
import log from "loglevel";

type State = {
  hasError: boolean
}

type Props = {
  children: React.ReactNode
}


export class ErrorBoundary extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error : any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error : any, info : any) {
    // log the error to our server with loglevel
    log.error({ error, info });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
