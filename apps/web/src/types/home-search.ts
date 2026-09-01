export type LocationMode = "nearby" | "home"

export type AgeRange = [number, number]

export type HomeSearchValues = {
  locationMode: LocationMode
  location: string
  ageRange: AgeRange
  hours: number
  minutes: number
}

export type HomeSearchFormProps = {
  initialValues?: HomeSearchValues
  initialLocationError?: string
  onValidSubmit: (values: HomeSearchValues) => void
}

export type NearestPostcodeResponse = {
  postcode?: string
}

export type FormValidationResult = {
  locationError: string
  timeError: string
  isValid: boolean
}
