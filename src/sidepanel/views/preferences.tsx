import { PreferencesForm } from "@/components/forms/preferences-form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { defaultPreferences } from "@/lib/constants";
import type { AvailableViews } from "@/lib/types";
import { CornerUpLeft } from "lucide-react";
import React, { useEffect } from "react";

type Props = {
    setOpenView: (value: AvailableViews) => void;
};

export const PreferencesView = ({ setOpenView }: Props) => {
    // Grab preferences object, this should

    useEffect(() => {}, []);

    return (
        <div className="h-3/4 w-full flex flex-1 flex-col gap-y-4 overflow-y-auto p-4">
            <h2 className="mt-4 mb-2 text-lg font-bold">Preferences</h2>

            {/* testing for contextMenu here */}

            <ScrollArea className="h-3/4 w-full flex flex-1 flex-col gap-y-4 overflow-y-auto">
                {/* Form Here */}
                <PreferencesForm />
            </ScrollArea>
            <div className="mt-auto w-full">
                <Button
                    onClick={() => setOpenView("main")}
                    variant="outline"
                    className="px-4 py-2 rounded mt-auto w-full">
                    Back to Main View
                    <span className="ml-4">
                        <CornerUpLeft className="w-4 h-4" />
                    </span>
                </Button>
            </div>
        </div>
    );
};
