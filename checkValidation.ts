import { ConfirmMessage } from 'components/helper/confirm-message'
import { ShowMessage } from 'components/helper/show-message'
import { TabMenuProductKey } from 'models/product'
import { FormInstance } from 'one-web-components-react'

type FieldPath = string | number | Array<string | number>

type ValidationResult<T = Record<string, unknown>> = {
  valid: boolean
  data: T | null
}

type ValidationState<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown }

const SOFT_WARNING_FIELDS: Array<{
  path: Array<string | number>
  message: string
}> = [
  {
    path: ['informasiProduct', 'noSuratEfektifProduk'],
    message: 'No Surat Efektif Pendaftaran Produk tidak terisi, lanjutkan?',
  },
  {
    path: ['informasiProduct', 'noSuratPenegasanProduk'],
    message: 'No Surat Penegasan Produk tidak terisi, lanjutkan?',
  },
]

const toPathKey = (path: FieldPath): string =>
  Array.isArray(path) ? path.join('.') : String(path)

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

const settleValidation = async <T>(
  validator: () => Promise<T>,
): Promise<ValidationState<T>> => {
  try {
    return { status: 'fulfilled', value: await validator() }
  } catch (reason) {
    return { status: 'rejected', reason }
  }
}

const getHardErrors = (
  error: any,
  allowedEmptySoftFields: Set<string>,
): any[] => {
  const errorFields = Array.isArray(error?.errorFields) ? error.errorFields : []
  return errorFields.filter(
    (field: any) => !allowedEmptySoftFields.has(toPathKey(field?.name)),
  )
}

export async function checkValidation(
  forms: [FormInstance, FormInstance],
  fields?: FieldPath[],
  tabMenu?: TabMenuProductKey,
): Promise<ValidationResult> {
  const [formIndex, formDetail] = forms
  const allowedEmptySoftFields = new Set<string>()

  if (tabMenu === 'Informasi Produk') {
    for (const item of SOFT_WARNING_FIELDS) {
      const value = formDetail.getFieldValue(item.path as any)
      if (!isEmptyValue(value)) continue

      const ok = await ConfirmMessage('Peringatan!', item.message)
      if (!ok) {
        return { valid: false, data: null }
      }

      allowedEmptySoftFields.add(toPathKey(item.path))
    }
  }

  if (tabMenu === 'Konfigurasi Transaksi.Up Front & Selling Fee') {
    const rawListGLFee = formDetail.getFieldValue(['upsellListGLFee'])
    const listGLFee = Array.isArray(rawListGLFee)
      ? rawListGLFee.map((item: any) => ({
          ...item,
          percentage: Number(item?.percentage),
          glNumber: String(item?.glNumber ?? ''),
        }))
      : []

    return {
      valid: true,
      data: {
        processType: 'U',
        jenisFee: formDetail.getFieldValue(['jenisFee']),
        percentDefault: formDetail.getFieldValue(['percentDefault']),
        listGLFee,
      },
    }
  }

  const hasExplicitFields = Array.isArray(fields)
  const detailFieldsToValidate = hasExplicitFields
    ? (fields ?? []).filter(path => !allowedEmptySoftFields.has(toPathKey(path)))
    : null

  const validateDetailForm = async () => {
    try {
      if (hasExplicitFields) {
        if (!detailFieldsToValidate || detailFieldsToValidate.length === 0) {
          return formDetail.getFieldsValue(true)
        }

        return await formDetail.validateFields(detailFieldsToValidate as any)
      }

      return await formDetail.validateFields()
    } catch (error: any) {
      const hardErrors = getHardErrors(error, allowedEmptySoftFields)
      if (hardErrors.length === 0) {
        return formDetail.getFieldsValue(true)
      }
      throw error
    }
  }

  // Hindari ketergantungan Promise.allSettled agar kompatibel lintas runtime.
  const indexResult = await settleValidation(() => formIndex.validateFields())
  const detailResult = await settleValidation(validateDetailForm)

  if (indexResult.status === 'rejected' || detailResult.status === 'rejected') {
    await ShowMessage(
      'warning',
      'Perhatian!',
      'Harap periksa kembali data yang dimasukkan, pastikan sudah terisi!',
    )
    return { valid: false, data: null }
  }

  return {
    valid: true,
    data: {
      ...indexResult.value,
      ...detailResult.value,
    },
  }
}
