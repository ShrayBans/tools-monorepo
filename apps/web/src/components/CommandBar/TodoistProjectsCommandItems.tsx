import { SiTodoist } from "@icons-pack/react-simple-icons"
import { AixCommandItem, commandBarIconCn, commandBarOpenAtom, CommandGroup, CommandSeparator } from "@shray/ui"
import { useNavigate } from "@tanstack/react-router"
import { useAtom } from "jotai"

import { useAuth } from "../../lib/auth-context"
import { trpc } from "../../lib/trpc"

export const TodoistProjectsCommandItems = () => {
  const [, setCommandBarOpen] = useAtom(commandBarOpenAtom)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch Todoist projects
  const { data: projectsData } = trpc.planning.listTodoistProjects.useQuery(undefined, {
    enabled: !!user,
  })

  const handleNavigateToProject = async (projectId: string, projectName: string) => {
    await navigate({
      to: "/todoist",
      // @ts-ignore
      search: { projectId }
    })
    setCommandBarOpen(false)
  }

  const handleNavigateToTodoist = async () => {
    await navigate({ to: "/todoist" })
    setCommandBarOpen(false)
  }

  const projects = projectsData?.projects || []

  if (!user || !projectsData || projects.length === 0) {
    return null
  }

  return (
    <>
      <CommandSeparator />
      <CommandGroup heading="Todoist Projects">
        {/* Main Todoist link */}
        <AixCommandItem
          key="todoist-main"
          onSelect={handleNavigateToTodoist}
          name="Todoist - All Projects"
          icon={<SiTodoist className={commandBarIconCn} />}
        />

        {/* Individual projects */}
        {projects.slice(0, 8).map((project: any) => (
          <AixCommandItem
            key={`todoist-project-${project.id}`}
            onSelect={() => handleNavigateToProject(project.id, project.name)}
            name={`Todoist - ${project.name} (${project.taskCount} tasks)`}
            icon={<SiTodoist className={commandBarIconCn} />}
          />
        ))}

        {projects.length > 8 && (
          <AixCommandItem
            key="todoist-view-all"
            onSelect={handleNavigateToTodoist}
            name={`Todoist - View all ${projects.length} projects`}
            icon={<SiTodoist className={commandBarIconCn} />}
          />
        )}
      </CommandGroup>
    </>
  )
}