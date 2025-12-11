import {Link} from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  //SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const data = [
    {
        group_name: 'AI Service',
        menu_items: [
            {
                name: 'AI Assistant',
                path: '/ai/chat'
            }
        ]

    },
    {
        group_name: 'Document Upload',
        menu_items: [
            {
                name: 'Invoice Upload',
                path: '/document-upload/'
            },
            {
                name:'Invoice List',
                path:'/document-upload/invoice'
            }
        ]
    }
] as {
    group_name: string;
    menu_items: {
        name: string;
        path: string;
    }[]
}[]

const AppSidebar = () => {
  return (
    <Sidebar>
        <SidebarHeader>Menu</SidebarHeader>
        <SidebarContent>
            {
                data.map((group,index) => (
                    <SidebarGroup key={index}>
                        <SidebarGroupLabel>{group.group_name}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            {
                                group.menu_items.map((menu,index) => (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton asChild>
                                            <Link to={menu.path}>{menu.name}</Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            }
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))
            }
        </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar