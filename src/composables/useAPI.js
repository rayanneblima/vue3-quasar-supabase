import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import useSupabase from 'src/boot/supabase'
import useAuthUser from './useAuthUser'
import useBrandConfigs from './useBrandConfigs'

const storeConfigs = ref({
  name: '',
  logo_url: '',
  whatsapp_number: '',
  primary_color: '',
  secondary_color: ''
})

export default function useAPI () {
  const route = useRoute()
  const { supabase } = useSupabase()
  const { user } = useAuthUser()
  const { setBrandColors } = useBrandConfigs()

  const $q = useQuasar()

  const list = async (table, select) => {
    const { data, error } = await supabase
      .from(table)
      .select(select || '*')

    if (error) throw error
    return data
  }

  const publicList = async (table, userId) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data
  }

  const getById = async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)

    if (error) throw error
    return data[0]
  }

  const getByUserId = async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', user.value.id)

    if (error) throw error
    return data[0]
  }

  const post = async (table, form) => {
    const { data, error } = await supabase
      .from(table)
      .insert([
        {
          ...form,
          user_id: user.value.id
        }
      ])

    if (error) throw error
    return data
  }

  const update = async (table, form) => {
    const { data, error } = await supabase
      .from(table)
      .update({
        ...form
      })
      .match({ id: form.id })

    if (error) throw error
    return data
  }

  const upsert = async (table, form) => {
    const id = form.id || crypto.randomUUID()

    const { data, error } = await supabase
      .from(table)
      .upsert({
        id,
        ...form,
        user_id: user.value.id
      }, { onConflict: 'id' })

    if (error) throw error
    return data
  }

  const remove = async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .match({ id })

    if (error) throw error
    return data
  }

  const getPublicURL = async (fileName, storage) => {
    const { publicURL, error } = await supabase
      .storage
      .from(storage)
      .getPublicUrl(fileName)

    if (error) throw error
    return publicURL
  }

  const uploadImg = async (file, storage) => {
    const fileName = crypto.randomUUID()

    const { error } = await supabase
      .storage
      .from(storage)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    const publicURL = await getPublicURL(fileName, storage)

    if (error) throw error
    return publicURL
  }

  const setStoreConfigs = async () => {
    const userId = user?.value?.id || route.params.userId

    $q.loading.show()

    const { data, error } = await supabase
      .from('store_configs')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    if (data) {
      storeConfigs.value = data[0]
      setBrandColors({
        primary: storeConfigs.value.primary_color,
        secondary: storeConfigs.value.secondary_color
      })
    }

    $q.loading.hide()
  }

  return {
    list,
    publicList,
    getById,
    getByUserId,
    post,
    update,
    upsert,
    remove,
    getPublicURL,
    uploadImg,
    storeConfigs,
    setStoreConfigs
  }
}
