import {NavLinkType, RouteElement} from "./types";

export function generateElement(re : RouteElement | undefined, path : string, withChildren ?: boolean) : NavLinkType {
  const link =  path + (re?.path || '');
  const genChildren = withChildren === undefined || withChildren;
  return {
    link: link,
    name: re?.name || '',
    icon: re?.icon,
    elements : genChildren ? re?.children?.map(e => generateElement(e, link + '/')) : undefined
  }
}
