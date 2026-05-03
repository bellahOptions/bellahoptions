import { Component } from "react";
import ErrorCanvas from "@/Components/ErrorCanvas";

export default class ClientErrorBoundary extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Client render error", error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <ErrorCanvas
                    status="client"
                    title="The page interface crashed."
                    message="Something went wrong in the browser while rendering this page. Refresh, go home, or return to the previous page."
                />
            );
        }

        return this.props.children;
    }
}
