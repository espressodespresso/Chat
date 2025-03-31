import Layout from "../components/Layout.js";
import AuthEnforce from "../components/auth/AuthEnforce.tsx";

export default function Home() {
    return (
        <>
            <AuthEnforce/>
            <Layout>
                <div class="grid grid-cols-1 place-items-center">
                    <h1>Hello - Home</h1>
                </div>
            </Layout>
        </>
    )
}