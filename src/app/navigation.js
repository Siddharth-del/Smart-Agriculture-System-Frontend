import {
  LayoutDashboard, Gauge, Sprout, ScanLine, MessagesSquare, CloudSun, UserRound, LifeBuoy,
  ShieldCheck, Users, Server, Binoculars,
} from 'lucide-react'
import { ROLES } from '../features/auth/authSlice'

const { FARMER, ADMIN, AGRONOMIST } = ROLES

/**
 * The one place that decides who can see what. Routes and navigation both read
 * from here so a link never appears for a page the user cannot open.
 * `roles` mirrors SecurityConfig: /api/ml, /api/disease, /api/ai and /api/farmer
 * are FARMER/ADMIN only; /api/admin is ADMIN only.
 */
export const NAV = [
  { group: 'group_farm', items: [
    { to: '/app/dashboard', key: 'nav_overview', icon: LayoutDashboard, roles: [FARMER], primary: true },
    { to: '/app/field', key: 'nav_field', icon: Gauge, roles: [FARMER, AGRONOMIST], primary: true },
    { to: '/app/weather', key: 'nav_weather', icon: CloudSun, roles: [FARMER, ADMIN, AGRONOMIST] },
  ] },
  { group: 'group_tools', items: [
    { to: '/app/plant-doctor', key: 'nav_doctor', icon: ScanLine, roles: [FARMER, ADMIN], primary: true },
    { to: '/app/crop-planner', key: 'nav_crop', icon: Sprout, roles: [FARMER, ADMIN] },
    { to: '/app/assistant', key: 'nav_assistant', icon: MessagesSquare, roles: [FARMER, ADMIN], primary: true },
    { to: '/app/agronomist', key: 'nav_agronomist', icon: Binoculars, roles: [AGRONOMIST], primary: true },
  ] },
  { group: 'group_admin', items: [
    { to: '/app/admin', key: 'nav_admin', icon: ShieldCheck, roles: [ADMIN], primary: true, end: true },
    { to: '/app/admin/farmers', key: 'nav_farmers', icon: Users, roles: [ADMIN], primary: true },
    { to: '/app/admin/system', key: 'nav_system', icon: Server, roles: [ADMIN] },
  ] },
  { group: 'group_account', items: [
    { to: '/app/profile', key: 'nav_profile', icon: UserRound, roles: [FARMER] },
    { to: '/app/help', key: 'nav_help', icon: LifeBuoy, roles: [FARMER, ADMIN, AGRONOMIST] },
  ] },
]

export const navForRoles = (roles) =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.some((r) => roles.includes(r))) }))
    .filter((g) => g.items.length)
