import AuthForm from "@/components/forms/firebase-auth-form";
import useFirebaseUser from "@/lib/firebase/hooks/use-firebase-user";

// Do we need this page?

export default function Options() {
    const { user, isLoading, onLogin } = useFirebaseUser();

    return (
        <div className="min-h-screen bg-black p-4 md:p-10">
            <div className="text-white flex flex-col space-y-10 items-center justify-center">
                {!user && <AuthForm />}
                {user && <div>You're signed in! Woo</div>}
            </div>
        </div>
    );
}
