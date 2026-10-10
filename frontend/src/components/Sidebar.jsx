import AppSidebar from "./AppSidebar.jsx";

export default function Sidebar(props) {
  // Map older props onRename / onDelete if passed directly
  const { onRename, onDelete, onRequestRename, onRequestDelete, ...rest } = props;

  const handleRequestRename = onRequestRename || (onRename ? (chat) => {
    const title = window.prompt("Give this conversation a new name", chat.title);
    if (title?.trim()) onRename(chat.id, title.trim());
  } : undefined);

  const handleRequestDelete = onRequestDelete || (onDelete ? (chat) => {
    if (window.confirm(`Delete "${chat.title}"? This can't be undone.`)) onDelete(chat.id);
  } : undefined);

  return (
    <AppSidebar
      {...rest}
      onRequestRename={handleRequestRename}
      onRequestDelete={handleRequestDelete}
    />
  );
}
