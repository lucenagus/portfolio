// Asset pipeline config.
// Originals live in /assets-src (git-ignored). Optimized files are written to /assets.
// Run `npm run optimize` after adding or changing anything here.
//
// images: one WebP per width -> assets/img/<out>-<width>.webp
//   widths are capped at the source width automatically.
//   mode: 'auto' (default) picks lossless when it is about as small as lossy
//         (flat graphics stay pixel-perfect), 'lossy' or 'lossless' to force.
// videos: H.264 MP4 without audio + first-frame WebP poster
//   -> assets/video/<out>.mp4 and assets/video/<out>-poster.webp
// copy: files copied as-is (favicons etc.)

// Full-bleed images: covers phones (3x) up to 1440 desktops at 2x.
const FULL = [800, 1280, 1920, 2880];
// Half-width / content images.
const HALF = [640, 1080, 1600, 2160];
// Home cards (420x540 desktop, up to ~680 wide on tablet).
const CARD = [480, 960, 1440];

export default {
  quality: 84, // WebP lossy quality (82–88 is visually lossless for most work)
  videoCrf: 23, // H.264 CRF (lower = better/larger). 20–26 is a sane range.

  images: [
    { src: 'shared/avatar.png', out: 'shared/avatar', widths: [96, 192] },
    { src: 'about/ufpe.png', out: 'about/ufpe', widths: [128] },

    { src: 'home/termoli.png', out: 'home/termoli', widths: CARD },
    { src: 'home/3d-scenes.jpg', out: 'home/3d-scenes', widths: CARD },
    { src: 'home/acaso-employee.png', out: 'home/acaso-employee', widths: CARD },

    { src: 'termoli/01.png', out: 'termoli/01', widths: FULL },
    { src: 'termoli/02.png', out: 'termoli/02', widths: FULL },
    { src: 'termoli/03.png', out: 'termoli/03', widths: FULL },
    { src: 'termoli/04.png', out: 'termoli/04', widths: HALF },
    { src: 'termoli/05.png', out: 'termoli/05', widths: HALF },
    { src: 'termoli/06.png', out: 'termoli/06', widths: [800, 1073] },
    { src: 'termoli/07.png', out: 'termoli/07', widths: FULL },
    { src: 'termoli/08.png', out: 'termoli/08', widths: FULL },
    { src: 'termoli/09.png', out: 'termoli/09', widths: FULL },
    { src: 'termoli/10.png', out: 'termoli/10', widths: HALF },
    { src: 'termoli/11.png', out: 'termoli/11', widths: HALF },
    { src: 'termoli/12.png', out: 'termoli/12', widths: FULL },
    { src: 'termoli/13.png', out: 'termoli/13', widths: FULL },
    { src: 'termoli/14.png', out: 'termoli/14', widths: FULL },
  ],

  videos: [
    { src: 'home/acaso.mp4', out: 'home/acaso', maxWidth: 700 },
    { src: 'home/unleash.mp4', out: 'home/unleash', maxWidth: 700 },
    { src: 'about/header.mp4', out: 'about/header', maxWidth: 1920 },
    { src: 'termoli/motion-1.mp4', out: 'termoli/motion-1', maxWidth: 720 },
    { src: 'termoli/motion-2.mp4', out: 'termoli/motion-2', maxWidth: 720 },
    { src: 'termoli/motion-3.mp4', out: 'termoli/motion-3', maxWidth: 720 },
    { src: 'termoli/vertical.mp4', out: 'termoli/vertical', maxWidth: 720 },
  ],

  copy: [
    { src: 'shared/favicon-light.png', out: 'img/favicon-light.png' },
    { src: 'shared/favicon-dark.png', out: 'img/favicon-dark.png' },
  ],
};
