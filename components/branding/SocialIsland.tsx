import { FacebookIcon, InstagramIcon } from "@/components/ui/icons";
import styles from "./SocialIsland.module.css";

const LINKS = [
  {
    href: "https://www.instagram.com/ogniwobielanyofficial/",
    label: "Ogniwo Bielany na Instagramie",
    Icon: InstagramIcon,
  },
  {
    href: "https://www.facebook.com/profile.php?id=100091320717260",
    label: "Ogniwo Bielany na Facebooku",
    Icon: FacebookIcon,
  },
];

export function SocialIsland() {
  return (
    <div className={styles.island}>
      {LINKS.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={styles.link}
        >
          <Icon width={19} height={19} strokeWidth={1.9} />
        </a>
      ))}
    </div>
  );
}
