import Image, { type StaticImageData } from 'next/image';
import topImg from '../../public/top.svg';
import bottomImg from '../../public/bottom.svg';
import fullImg from '../../public/full.svg';

const TopBgImage = () => (
  <Image
    src={topImg as StaticImageData}
    alt={''}
    fill
    priority
    className="py-4"
  />
);

const BottomBgImage = () => (
  <Image
    src={bottomImg as StaticImageData}
    alt={''}
    fill
    priority
    className="py-4"
  />
);

const FullBgImage = () => (
  <Image src={fullImg as StaticImageData} alt={''} fill priority />
);

export { TopBgImage, BottomBgImage, FullBgImage };
