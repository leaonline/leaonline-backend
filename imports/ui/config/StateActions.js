export const StateActions = {
  insert: 'insert',
  update: 'update',
  remove: 'remove',
  upload: 'upload',
  settings: 'settings'
}

export const updateStateAction = function updateStateAction ({ action = 'reset', updateDoc, instance }) {
  switch (action) {
    case StateActions.insert:
      return instance.state.set({
        insertForm: true,
        updateForm: false,
        updateDoc: null
      })
    case StateActions.update:
      return instance.state.set({
        insertForm: null,
        updateForm: true,
        updateDoc
      })
    case 'reset':
      return instance.state.set({
        insertForm: null,
        updateForm: null,
        updateDoc: null
      })
  }
}
