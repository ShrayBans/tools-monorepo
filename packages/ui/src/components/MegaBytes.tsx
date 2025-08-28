export const MegaBytes: React.FC<{
  sizeInBytes: number
}> = ({ sizeInBytes }) => {
  const megabytes = Intl.NumberFormat("en", {
    notation: "compact",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
  }).format(sizeInBytes)
  return <span style={{ opacity: 0.6 }}>{megabytes}</span>
}
