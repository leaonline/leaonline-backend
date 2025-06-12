export const getFieldSettings = (settingsDoc, key) => {
  if (!settingsDoc || !key || !settingsDoc.fields) return
  return settingsDoc.fields.find((entry) => entry.name === key)
}
