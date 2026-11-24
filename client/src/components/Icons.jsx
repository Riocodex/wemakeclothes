/* eslint-disable react/prop-types */
const Icon = ({ children, className = 'h-4 w-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {children}
  </svg>
)

export const ArrowLeftIcon = (props) => (
  <Icon {...props}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Icon>
)

export const BagIcon = (props) => (
  <Icon {...props}><path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></Icon>
)

export const GridIcon = (props) => (
  <Icon {...props}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Icon>
)

export const PlusIcon = (props) => (
  <Icon {...props}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
)

export const SearchIcon = (props) => (
  <Icon {...props}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></Icon>
)

export const EyeIcon = (props) => (
  <Icon {...props}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.5" /></Icon>
)

export const TrashIcon = (props) => (
  <Icon {...props}><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /></Icon>
)

export const TagIcon = (props) => (
  <Icon {...props}><path d="M3.5 12.5V4h8.5l8.5 8.5-8 8-9-8z" /><circle cx="8" cy="8.5" r="1.3" /></Icon>
)

export const CloseIcon = (props) => (
  <Icon {...props}><path d="M6 6l12 12" /><path d="M18 6 6 18" /></Icon>
)

export const SaveIcon = (props) => (
  <Icon {...props}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4" /><path d="M8 20v-6h8v6" /></Icon>
)

export const ShirtIcon = (props) => (
  <Icon {...props}><path d="M8 3.5 3.5 6.5l2 4 2-1V20.5h9V9.5l2 1 2-4L16 3.5c-.5 1.8-2 3-4 3s-3.5-1.2-4-3z" /></Icon>
)

export const LockIcon = (props) => (
  <Icon {...props}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Icon>
)

export const SparkIcon = (props) => (
  <Icon {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></Icon>
)

export const EditIcon = (props) => (
  <Icon {...props}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></Icon>
)

export const ReceiptIcon = (props) => (
  <Icon {...props}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></Icon>
)

export const AlertIcon = (props) => (
  <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5h.01" /></Icon>
)

export const WimikMark = ({ className = 'h-4 w-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path d="M2.2 3.2h3.1l2.2 7.1L10.5 3.2h3l2.2 7.1 2.2-7.1h3.1L16.8 16.8h-3.3L11.9 9.2l-1.6 7.6H7Z" />
  </svg>
)

export const CubeIcon = (props) => (
  <Icon {...props}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="m4 7.5 8 4.5 8-4.5" /><path d="M12 12v9" /></Icon>
)
