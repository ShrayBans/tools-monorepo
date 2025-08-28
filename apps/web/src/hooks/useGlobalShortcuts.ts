import { commandBarOpenAtom } from "@shray/ui"
import { useNavigate } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { useHotkeys } from "react-hotkeys-hook"

/**
 * Global keyboard shortcuts for the application
 * Should be called at the top level of the app to ensure shortcuts work everywhere
 */
export const useGlobalShortcuts = () => {
	const [commandBarOpen, setCommandBarOpen] = useAtom(commandBarOpenAtom);
	const navigate = useNavigate();

	// Cmd+K to toggle command bar
	useHotkeys(
		"meta+K",
		(event) => {
			event.preventDefault();
			setCommandBarOpen(!commandBarOpen);
		},
		{
			enableOnFormTags: true,
			enableOnContentEditable: true,
			preventDefault: true,
		},
	);

	// ESC to close command bar
	useHotkeys(
		"escape",
		() => {
			if (commandBarOpen) {
				setCommandBarOpen(false);
			}
		},
		{
			enableOnFormTags: true,
			enableOnContentEditable: true,
			enabled: commandBarOpen,
		},
	);
};
