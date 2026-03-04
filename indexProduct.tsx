//#region IMPORT PACKAGE
import MainBreadcrumb from 'components/breadcrumb'
import { tabCommandRegistry } from 'components/helper/tab-command-provider'
import { checkIfEmpty } from 'components/helper/validation'
import DokumenProduk from 'components/produk/dokumen-online'
import InformasiProduk from 'components/produk/informasi-produk'
import KinerjaProduk from 'components/produk/kinerja-produk'
import KonfigurasiTransaksi from 'components/produk/konfigurasi-transaksi'
import KonfigurasiTransaksiIBMB from 'components/produk/konfigurasi-transaksi-ibmb'
import RegularSubscription from 'components/produk/regular-subscription'
import { useGetManagerInvestasi } from 'hooks/global-parameter/manager-investasi/useGetManagerInvestasi'
import { useGetTipeReksadana } from 'hooks/global-parameter/tipe-reksadana/useGetTipeReksadana'
import { useGetListDataNav } from 'hooks/product/useGetListDataNav'
import { useGetListProduct } from 'hooks/product/useGetListProduct'
import { BaseModelManagerInvestation } from 'models/manager-investation'
import { InformationProductModel, ListModelDataProduct, TabMenuProductKey } from 'models/product'
import { BaseModelProductType } from 'models/product-type'
import {
  Button,
  Card,
  ClockCircleOutlined,
  Col,
  DollarOutlined,
  Flex,
  Form,
  Input,
  LoadingOutlined,
  Row,
  Select,
  SettingOutlined,
  Spin,
  Tabs,
  UserOutlined,
  UserSwitchOutlined,
} from 'one-web-components-react'
import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import { getDetailInformationProduct } from 'services/master/product/main-service'
import {
  InitialValuesDetailProduct,
  ProdukDetailRoutes,
  ProdukNewRoutes,
  ProdukRoutes,
  ProdukUpdateRoutes,
} from 'variables/produk'
import { PageProps, withInitialPage } from 'web-layout-react'
import { checkValidation } from './validation'
import { useUserHasAccess } from 'hooks/useUserHasAccess'
import { useUserHasMenu } from 'hooks/useUserHasMenu'
import { ShowMessage } from 'components/helper/show-message'
//#endregion IMPORT PACKAGE

const { Option } = Select

const page = withInitialPage(
  async () => {
    // const listProduct = await inqListProduct();

    // const queryParams = new URLSearchParams(location.search)
    try {
      // const res = await getInqDataMaster(modelreq)
      const initialData: any = {
        // listProduct: listProduct,
      }

      return initialData
    } catch (error) {
      throw error
    }
  },
  Product,
  {
    accessScope: [''],
  },
)

function Product({ data, isValidating, mutate }: PageProps<any>) {
  //#region USER ACCESS
  const hasAccessMenu = useUserHasMenu('masterproduk')
  const hasWriteAccess = useUserHasAccess('masterproduk', 'write')
  const hasUpdateAccess = useUserHasAccess('masterproduk', 'update')
  //#endregion USER ACCESS
  // const { listProduct }: any = data;
  const [formIndex] = Form.useForm()
  const [formDetailProduct] = Form.useForm()

  //#region STATE
  const [routes, setRoutes] = useState<any>(ProdukRoutes)
  const [isNew, setIsNew] = useState<boolean>(false)
  const [isUpdate, setIsUpdate] = useState<boolean>(false)
  const [onEdit, setOnEdit] = useState<boolean>(false)
  const [selectProduct, setSelectProduct] = useState<boolean>(false)
  const [product, setProduct] = useState<InformationProductModel>()
  const [activeTab, setActiveTab] = useState<TabMenuProductKey>('Informasi Produk')
  const [productId, setProductId] = useState<number>()
  const [loading, setLoading] = useState<boolean>(false)
  //#endregion STATE

  //#region SWR
  const { data: listProduct, isLoading: validatingProduct } = useGetListProduct()
  const { data: listManagerInvestasi, isLoading: validatingManager } = useGetManagerInvestasi()
  const { data: listProductType, isLoading: validatingProductType } = useGetTipeReksadana()
  const { data: listDataNav, isLoading: validatingNav } = useGetListDataNav()

  const swrLoading = [
    validatingProduct && !listProduct,
    validatingManager && !listManagerInvestasi,
    validatingProductType && !listProductType,
    validatingNav && !listDataNav,
  ].some(Boolean)
  //#endregion SWR

  const finalLoading = loading || swrLoading

  //#region MEMO
  const memoProduct = useMemo(() => product, [product])
  const optionListProduct = useMemo(() => {
    return (
      listProduct?.map((item: ListModelDataProduct) => ({
        label: item.productCode,
        value: item.productId,
        desc: item.productName,
      })) || []
    )
  }, [listProduct])
  const optionListProductType = useMemo(() => {
    return (
      listProductType?.map((item: BaseModelProductType) => ({
        label: item.productTypeCode,
        value: item.productTypeId,
        desc: item.productTypeNameID,
      })) || []
    )
  }, [listProductType])
  const optListManagerInvestasi = useMemo(() => {
    return (
      listManagerInvestasi?.map((item: BaseModelManagerInvestation) => ({
        label: item.manInvCode,
        value: item.manInvId,
        desc: item.manInvName,
      })) || []
    )
  }, [listManagerInvestasi])
  //#endregion MEMO

  //#region TABS ITEMS LIST
  const tabItemsProduk: {
    label: string
    disabled: boolean
    key: TabMenuProductKey
    icon: JSX.Element
    children: JSX.Element
  }[] = [
    {
      label: 'Informasi Produk',
      disabled: isUpdate,
      key: 'Informasi Produk',
      icon: <UserOutlined />,
      children: <InformasiProduk data={{ product: memoProduct, selectProduct, isNew, isUpdate }} />,
    },
    {
      label: 'Pengaturan Transaksi',
      disabled: isUpdate,
      key: 'Konfigurasi Transaksi',
      icon: <SettingOutlined />,
      children: (
        <KonfigurasiTransaksi
          data={{ product: memoProduct, selectProduct, isNew, isUpdate, setActiveTab }}
        />
      ),
    },
    {
      label: 'Pengaturan Transaksi IB/MB',
      disabled: isUpdate,
      key: 'Konfigurasi Transaksi IB/MB',
      icon: <SettingOutlined />,
      children: (
        <KonfigurasiTransaksiIBMB
          data={{
            product: memoProduct,
            selectProduct,
            isNew,
            isUpdate,
          }}
        />
      ),
    },
    {
      label: 'Kinerja Produk',
      disabled: isUpdate,
      key: 'Kinerja Produk',
      icon: <DollarOutlined />,
      children: (
        <KinerjaProduk
          data={{ product: memoProduct, selectProduct, isNew, isUpdate, setOnEdit, setActiveTab }}
        />
      ),
    },
    {
      label: 'Dokumen Online',
      disabled: isUpdate,
      key: 'Dokumen Online',
      icon: <UserSwitchOutlined />,
      children: <DokumenProduk data={{ product: memoProduct, selectProduct, isNew, isUpdate }} />,
    },
    {
      label: 'Regular Subscription',
      disabled: isUpdate,
      key: 'Regular Subscription',
      icon: <ClockCircleOutlined />,
      children: (
        <RegularSubscription data={{ product: memoProduct, selectProduct, isNew, isUpdate }} />
      ),
    },
  ]
  //#endregion TABS ITEMS LIST

  const onChangeProduct = async (data: any) => {
    setProductId(listProduct.find(item => item.productId === data).productId)
    formIndex.setFieldValue('prodName', optionListProduct.find(item => item.value === data).desc)
  }

  const filterProductSelect = (input: string, option?: any): boolean => {
    if (!option) return false
    const label: string = option.label ?? ''
    const desc: string = option.desc ?? ''

    return (
      label.toLowerCase().trim().includes(input.toLowerCase()) ||
      desc.toLowerCase().trim().includes(input.toLowerCase())
    )
  }

  const onChangeProductType = async (data: any) => {
    formIndex.setFieldValue(
      'productTypeText',
      optionListProductType?.find(item => item.value === data)?.desc,
    )
  }

  const filterProductTypeSelect = (input: string, option?: any): boolean => {
    if (!option) return false

    const label: string = option.label ?? ''
    const desc: string = option.desc ?? ''

    return (
      label.toLowerCase().trim().includes(input.toLowerCase()) ||
      desc.toLowerCase().trim().includes(input.toLowerCase())
    )
  }

  const submitSearch = async () => {
    setLoading(true)
    const resData = await getDetailInformationProduct({ productId: productId })

    if (resData) {
      setSelectProduct(true)
      setProduct({ ...resData.informationProduct, ...resData.configurationTransaksi })

      setRoutes(ProdukDetailRoutes)
      setProduct(currentData => {
        const newValue = {
          ...currentData,
          productTypeText: optionListProductType?.find(item => item.label === currentData.typeId)
            ?.desc,
          managerInvText: optListManagerInvestasi?.find(item => item.label === currentData.manInvId)
            ?.desc,
          ListDataNav: listDataNav,
          ListDataDeviden: listDataNav,
        }
        formIndex.setFieldsValue(newValue)
        formDetailProduct.setFieldsValue(newValue)
        return newValue
      })
    } else {
      // message.info('Harap Pilih Produk Terlebih dahulu.')
    }
    setLoading(false)
  }

  const onClickButton = async (action: 'NEW' | 'UPDATE' | 'SAVE' | 'CANCEL') => {
    switch (action) {
      case 'NEW': {
        setProduct(null)
        formIndex.resetFields()
        formDetailProduct.resetFields()
        setIsNew(true)
        setIsUpdate(false)
        setRoutes(ProdukNewRoutes)
        return
      }

      case 'UPDATE': {
        setIsUpdate(true)
        setIsNew(false)
        setRoutes(ProdukUpdateRoutes)
        return
      }

      case 'SAVE': {
        try {
          const fields = tabCommandRegistry.getFields(activeTab) as
            | Array<Array<string | number>>
            | undefined

          console.log('[SAVE] before checkValidation')
          setLoading(true)
          const result = await checkValidation([formIndex, formDetailProduct], fields, activeTab)
          console.log('[SAVE] validation result:', result)
          setLoading(false)

          if (!result.valid || !result.data) {
            console.warn('[SAVE] stop reason:', result.reason, result.error)
            return
          }

          // lanjut proses save ke API
          // await saveProduct(data)
          console.log('payload valid:', data)
          return
        } catch (error) {
          console.error('[SAVE] checkValidation crashed:', error)
          void ShowMessage(
            'warning',
            'Perhatian!',
            'Terjadi kesalahan saat proses validasi, silakan coba lagi.',
          )
          return
        }
      }

      case 'CANCEL':
      default: {
        defaultPageSetting()
        return
      }
    }
  }

  const defaultPageSetting = () => {
    setOnEdit(false)
    setProduct(null)
    formIndex.resetFields()
    formDetailProduct.resetFields()
    setRoutes(ProdukRoutes)
    setSelectProduct(false)
    setIsUpdate(false)
    setIsNew(false)
  }

  useEffect(() => {
    console.log(product, 'berubah')
  }, [product])

  if (!hasAccessMenu) return null
  return (
    <>
      <Helmet>
        <title>Web Reksa - Master - Produk</title>
      </Helmet>
      <Spin
        spinning={finalLoading}
        tip={
          <>
            <b>Loading...</b>
          </>
        }
        size="large"
        indicator={<LoadingOutlined />}
      >
        {/* Header Segment */}
        <Card>
          <Form form={formIndex} layout="vertical">
            <Row justify="space-between">
              <Col span={21}>
                {!isNew && !selectProduct && (
                  <Flex gap={6}>
                    <Form.Item
                      style={{ flex: '0 0 11rem' }}
                      label="Cari Produk"
                      className="override-label"
                    >
                      <Select
                        placeholder="Pilih Produk...."
                        options={optionListProduct}
                        optionLabelProp="label"
                        optionRender={option => (
                          <>
                            {option.data.label} - {option.data.desc}
                          </>
                        )}
                        dropdownStyle={{
                          whiteSpace: 'normal',
                          minWidth: 500,
                          wordBreak: 'break-word',
                        }}
                        style={{ display: 'block', width: '100%' }}
                        showSearch={true}
                        popupMatchSelectWidth={false}
                        notFoundContent={'Tidak Ditemukan.'}
                        filterOption={filterProductSelect}
                        onChange={onChangeProduct}
                        data-testid="pages-master-produk-index_select_cari-produk"
                      />
                    </Form.Item>
                    <Form.Item style={{ flex: '0 0 24rem' }} label={' '} name="prodName">
                      <Input
                        disabled
                        placeholder="Nama Produk...."
                        data-testid="pages-master-produk-index_input_prodname"
                      />
                    </Form.Item>
                    <Form.Item style={{ flex: 1 }} label={' '}>
                      <Button
                        type="primary"
                        onClick={submitSearch}
                        data-testid="pages-master-produk-index_button_search"
                      >
                        Search
                      </Button>
                    </Form.Item>
                  </Flex>
                )}
                {(selectProduct || isNew) && (
                  <Flex gap={6}>
                    <Form.Item
                      style={{ flex: '0 0 6rem', maxWidth: '6rem' }}
                      rules={[checkIfEmpty]}
                      label="Kode Produk"
                      name="productCode"
                      className="override-label"
                    >
                      <Input
                        onChange={e =>
                          formIndex.setFieldValue('productCode', e.target.value.toUpperCase())
                        }
                        disabled={selectProduct}
                        maxLength={10}
                        data-testid="pages-master-produk-index_input_kode-produk"
                      />
                    </Form.Item>
                    <Form.Item
                      style={{ flex: 2 }}
                      rules={[checkIfEmpty]}
                      label="Nama Produk"
                      name="prodName"
                      className="override-label"
                    >
                      <Input
                        onChange={e =>
                          formIndex.setFieldValue('prodName', e.target.value.toUpperCase())
                        }
                        disabled={selectProduct}
                        maxLength={40}
                        data-testid="pages-master-produk-index_input_nama-produk"
                      />
                    </Form.Item>
                    <Form.Item
                      style={{ flex: '1 0 1rem', width: '100%' }}
                      rules={[checkIfEmpty]}
                      label="Jenis Produk"
                      name="typeId"
                      className="override-label"
                    >
                      <Select
                        placeholder="Select Jenis"
                        value={memoProduct?.typeId ? memoProduct?.typeId : ''}
                        options={optionListProductType}
                        optionLabelProp="label"
                        optionRender={option => (
                          <>
                            {option.data.label} - {option.data.desc}
                          </>
                        )}
                        dropdownStyle={{
                          whiteSpace: 'normal',
                          minWidth: 200,
                          wordBreak: 'break-word',
                        }}
                        showSearch={true}
                        notFoundContent={'Tidak Ditemukan.'}
                        onChange={onChangeProductType}
                        filterOption={filterProductTypeSelect}
                        disabled={selectProduct}
                        data-testid="pages-master-produk-index_select_jenis-produk"
                      />
                    </Form.Item>
                    <Form.Item
                      style={{ flex: 2 }}
                      label={' '}
                      name="productTypeText"
                      className="override-label"
                    >
                      <Input
                        disabled
                        data-testid="pages-master-produk-index_input_producttypetext"
                      />
                    </Form.Item>
                    {selectProduct ? (
                      <>
                        <Form.Item
                          style={{ flex: 1 }}
                          label="Mata Uang"
                          name="productCcy"
                          className="override-label"
                        >
                          <Input
                            style={{ maxWidth: '6.2rem' }}
                            disabled={selectProduct}
                            data-testid="pages-master-produk-index_input_mata-uang"
                          />
                        </Form.Item>
                      </>
                    ) : (
                      <>
                        <Form.Item
                          style={{ flex: 1, maxWidth: '6rem' }}
                          rules={[checkIfEmpty]}
                          label="Mata Uang"
                          name="ProdCCY"
                          className="override-label"
                        >
                          <Select
                            disabled={!isNew && !isUpdate}
                            placeholder="Select Currency"
                            data-testid="pages-master-produk-index_select_mata-uang"
                          >
                            <Option value="idr">IDR</Option>
                            <Option value="usd">USD</Option>
                          </Select>
                        </Form.Item>
                      </>
                    )}
                  </Flex>
                )}
              </Col>
              <Col span={3} style={{ paddingLeft: '1rem' }}>
                <Flex gap={6} vertical>
                  {!selectProduct && !isNew && hasWriteAccess && (
                    <Button
                      style={{ flex: '0 0 1.6rem' }}
                      onClick={() => onClickButton('NEW')}
                      data-testid="pages-master-produk-index_button_new"
                    >
                      New
                    </Button>
                  )}
                  {selectProduct && !isUpdate && hasUpdateAccess && (
                    <>
                      <Button
                        style={{ flex: '0 0 1.6rem' }}
                        onClick={() => onClickButton('UPDATE')}
                        data-testid="pages-master-produk-index_button_update"
                      >
                        Update
                      </Button>
                    </>
                  )}
                  {(isNew || isUpdate) && (
                    <Button
                      style={{ flex: '0 0 1.6rem' }}
                      type="primary"
                      loading={loading}
                      disabled={onEdit}
                      onClick={() => onClickButton('SAVE')}
                      data-testid="pages-master-produk-index_button_save"
                    >
                      Save
                    </Button>
                  )}
                  {(selectProduct || isNew || isUpdate) && (
                    <Button
                      style={{ flex: '0 0 1.6rem' }}
                      onClick={() => onClickButton('CANCEL')}
                      data-testid="pages-master-produk-index_button_cancel"
                    >
                      Cancel
                    </Button>
                  )}
                </Flex>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Using Main Breadcrumb Design */}
        <MainBreadcrumb
          listRoutes={routes}
          status={selectProduct ? product?.status || null : null}
        />

        <Card>
          <Form
            form={formDetailProduct}
            preserve={false}
            initialValues={InitialValuesDetailProduct}
          >
            <Tabs
              defaultActiveKey="Informasi Product"
              tabPosition={'top'}
              type={'line'}
              items={isNew ? [tabItemsProduk[0]] : tabItemsProduk}
              onChange={key => {
                setActiveTab(key as TabMenuProductKey)
              }}
              data-testid="pages-master-produk-index_tabs_list-menu-produk"
            />
          </Form>
        </Card>
      </Spin>
    </>
  )
}

export default page
