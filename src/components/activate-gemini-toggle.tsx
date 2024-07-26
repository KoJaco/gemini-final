import { Switch } from "@/components/ui/switch"

type Props = {
  enabled: boolean
  setEnabled: (value: boolean) => void
  // tooltipContent?: string;
}

const ActivateGeminiToggle = ({
  enabled,
  setEnabled
}: // tooltipContent,
Props) => {
  return (
    <div>
      <Switch
        checked={enabled}
        onCheckedChange={() => setEnabled(!enabled)}
        id="gemini-enabled"
        className="data-[state=checked]:bg-green-500"
        aria-label="Enable or Disable Automatic Accessibility Improvements."
      />
    </div>
  )
}

export default ActivateGeminiToggle
