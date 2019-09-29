export const onServer = x => Meteor.isServer ? x : void 0
export const onClient = x => Meteor.isClient ? x : void 0
export const onMobile = x => Meteor.isCordova ? x : void 0
