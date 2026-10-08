/**
 * Props for the `ActivityHeader` component.
 */
export type ActivityHeaderProps = {
  /** The title of the recommended activity mission. */
  title: string;
  /** Heading element used for the mission title. */
  headingLevel?: "h1" | "h2";
  /** DOM identifier used by the surrounding labelled region. */
  titleId?: string;
};

/**
 * Header section of the activity result view displaying match reason badges, mission title, and key metadata.
 *
 * @param props - Component properties configuring title, badges, and metadata labels.
 */
export function ActivityHeader({
  title,
  headingLevel = "h1",
  titleId = "activity-title",
}: ActivityHeaderProps) {
  const Heading = headingLevel;

  return (
    <div className="text-center">
      <Heading
        className="text-2xl font-bold tracking-tight text-zinc-900 md:text-2xl"
        id={titleId}
      >
        {title}
      </Heading>
    </div>
  );
}
