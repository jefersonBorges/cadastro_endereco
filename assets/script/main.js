
const Register_address = {
  init: function(){
    this.cache_selectors()
    this.bind_events()
    this.set_initial_visibility()
  },

  cache_selectors: function(){

    this.$user_address = document.querySelector('#user_address')
    this.$user_address_list = document.querySelector('#user_address_list')
    this.$btn_add_address = document.querySelector('#btn_add_address')
    
    this.$register_address_form = document.querySelector('#register_address_form')
    
    this.$address_input_mode_select = document.querySelector('#address_input_mode_select')
    this.$input_mode = document.querySelectorAll('[name=input_mode]')

    this.$address_input_by_zip_code = document.querySelector('#address_input_by_zip_code')
    this.$zip_code = document.querySelector('#zip_code')
    
    this.$address_input_by_address_selection = document.querySelector('#address_input_by_address_selection')
    this.$select_street = document.querySelector('#select_street')
    this.$select_state = document.querySelector('#select_state')
    this.$select_city = document.querySelector('#select_city')
    this.$select_zip_code = document.querySelector('#select_zip_code')

    this.$register_address_confirmation = document.querySelector('#register_address_confirmation')
    
    this.$action_buttons = document.querySelector('#action_buttons')
    this.$btn_submit_address = document.querySelector('#btn_submit_address')
    this.$btn_reset_address = document.querySelector('#btn_reset_address')
  },

  bind_events: function(){

    this.$btn_add_address.onclick = this.Events.enable_address_input_mode_select.bind(this)

    this.$input_mode.forEach(element => {
      element.onclick = this.Events.enable_selected_field.bind(this)
    });

    this.$zip_code.onblur = this.Events.fill_address.bind(this)

    this.$select_street.onblur = this.Events.load_state_options.bind(this)
    this.$select_state.onblur = this.Events.load_city_options.bind(this)
    this.$select_city.onblur = this.Events.load_zip_code_options.bind(this)
    this.$select_zip_code.onchange = this.Events.enable_address_confirmation.bind(this)

    this.$btn_submit_address.onclick = this.Events.register_address.bind(this)
    this.$btn_reset_address.onclick = this.Events.reset_fieldset.bind(this)
  },

  Events:{
    enable_address_input_mode_select: function(e){
      const elementsToFlex = [
        this.$register_address_form,
        this.$address_input_mode_select,
        this.$action_buttons
      ]
      const elementsToHide = [
        this.$user_address
      ]
      this.display_flex(elementsToFlex)
      this.display_none(elementsToHide)
    },

    enable_selected_field: function(e){
      const action = e.srcElement.defaultValue
      const elementsToHide = []
      const elementsToFlex = []

      if(action == 'use_zip_code'){
        elementsToFlex.push(this.$address_input_by_zip_code)
        elementsToHide.push(this.$address_input_by_address_selection)

      }else if (action == 'search_zip_code'){
        elementsToFlex.push(this.$address_input_by_address_selection)
        elementsToHide.push(this.$address_input_by_zip_code)

      }

      this.display_flex(elementsToFlex)
      this.display_none(elementsToHide)
    },
    
    fill_address: function(e){
      const fieldRow = e.srcElement
      const zipCode = fieldRow.value
      const isValid = this.Validate.zip_code_field(zipCode)
      const elementsToFlex = [this.$register_address_confirmation]
      
      if(isValid){
        this.Get.address(zipCode)
          .then(response => this.check_response_error(response))
          .then(requstedAddress => {
            this.set_address_info(requstedAddress, "Address by Zip Code", this.$register_address_confirmation)
            this.set_message(fieldRow, this.Message.field_correct, this.Message.Type.success)
            this.display_flex(elementsToFlex)
            this.$btn_submit_address.disabled = false
          })
          .catch(error => this.set_message(fieldRow, error.message, this.Message.Type.danger))
      }else{
        this.set_message(fieldRow, this.Message.field_incorrect, this.Message.Type.warning)
      }
    },

    load_state_options: function(e){

      const selectState = e.relatedTarget
      const fieldRow = e.srcElement
      const street = fieldRow.value
      const isValid = this.Validate.street_field(street)

      if(isValid){
        this.clear_options(selectState)
        this.Get.states()
          .then(response => this.check_response_error(response))
          .then(statesList => {
            statesList.forEach(state => {
              const{id, sigla, nome} = state
              const value = JSON.stringify({id:id , sigla: sigla}) 
              const text = `${sigla} - ${nome}`
              this.set_option(selectState, value, text)
            });
            this.set_message(fieldRow, this.Message.field_correct, this.Message.Type.success)
          })
          .catch(error => this.set_message(fieldRow, error.message, this.Message.Type.danger))
      }else{
        this.set_message(fieldRow, this.Message.field_incorrect, this.Message.Type.warning)
      }
    },

    load_city_options: function(e){
      const selectCity = e.relatedTarget
      const fieldRow = e.srcElement
      const state = fieldRow.value ? JSON.parse(fieldRow.value).sigla : '0'
      const isValid = this.Validate.state_field(state)

      if(isValid){
        this.clear_options(selectCity)
        const stateId = JSON.parse(this.$select_state.value).id
        this.Get.cities(stateId)
          .then(response => this.check_response_error(response))
          .then(citiesList => {
            citiesList.forEach(city=>{
              const{nome} = city
              this.set_option(selectCity, nome, nome)
            })
            this.set_message(fieldRow, this.Message.field_correct, this.Message.Type.success)
          })
          .catch(error => this.set_message(fieldRow, error.message, this.Message.Type.danger))
      }else{
        this.set_message(fieldRow, this.Message.field_incorrect, this.Message.Type.warning)
      }

    },

    load_zip_code_options: function(e){
      const selectZipCode = e.relatedTarget
      const fieldRow = e.srcElement
      const searchCity = fieldRow.value
      const isValidCity = this.Validate.city_field(searchCity)

      if(isValidCity){
        this.clear_options(selectZipCode)
        const searchStreet = this.$select_street.value
        const searchState = JSON.parse(this.$select_state.value).sigla
        
        this.Get.zip_codes(searchState, searchCity, searchStreet)
          .then(response => this.check_response_error(response))
          .then(zipCodesList=>{
            zipCodesList.forEach(zipCode=>{
              const {bairro, cep, complemento, ibge, localidade, logradouro, uf} = zipCode

              const zip = `Cep: ${cep}`
              const street = logradouro ? `, ${logradouro}` : ''
              const compl = complemento ? `, Complemento: ${complemento}` : ''
              const district = bairro ? `, Bairro: ${bairro}` : ''
              const city = ` - ${localidade}`
  
              const text = `${zip}${street}${compl}${district}${city}`
              const value = JSON.stringify({cep, logradouro, complemento, bairro, localidade, uf, ibge})
              
              this.set_option(selectZipCode, value, text)
            })
            this.set_message(fieldRow, this.Message.field_correct, this.Message.Type.success)
          })
          .catch(error => this.set_message(fieldRow, error.message, this.Message.Type.danger))
      }else{
        this.set_message(fieldRow, this.Message.field_incorrect, this.Message.Type.warning)
      }
    },

    enable_address_confirmation: function(e){
      const fieldRow = e.srcElement
      const zipCode = fieldRow.value
      const elementsToFlex = [this.$register_address_confirmation]

      if(zipCode){
        this.set_address_info(JSON.parse(zipCode), "Selected Address", this.$register_address_confirmation)
        this.display_flex(elementsToFlex)
        this.$btn_submit_address.disabled = false
        this.set_message(fieldRow, this.Message.field_correct, this.Message.Type.success)
      }else{
        this.$btn_select_zip_code.disabled = true
        this.set_message(fieldRow, this.Message.field_incorrect, this.Message.Type.warning)
      }
    },

    reset_fieldset: function(e){
      e.preventDefault()
      this.set_initial_visibility()
    },

    register_address: function(e){
      e.preventDefault()
      const address = e.srcElement.parentNode.previousElementSibling.children[1]
      this.$user_address_list.appendChild(address)
      this.set_initial_visibility()
    },

  },

  Get:{
    states: async function(){
      return await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome`)
      .then(states => states.json())
    },
    cities: async function(stateId){
      return await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/distritos?orderBy=nome`)
      .then(cities => cities.json())
    },
    zip_codes: async function(state, city, street){
      return await fetch(`https://viacep.com.br/ws/${state}/${city}/${street}/json/`)
      .then(zipCodes => zipCodes.json())
    },
    address: async function(zip){
      return await fetch(`https://viacep.com.br/ws/${zip}/json/`)
        .then(address => address.json())
    },
  },

  set_address_info: function(requestedAddress, description, field){
    this.clear_register_address_confirmation_field()

    const{
      cep,
      logradouro,
      complemento,
      bairro,
      localidade,
      uf,
    } = requestedAddress

    const div = document.createElement('div')
    div.setAttribute('class', 'addressListItem')

    const h3 = document.createElement('h3')
    h3.innerText = `${description}`
    div.appendChild(h3)

    const p1 = document.createElement('p')
    p1.innerText = `${logradouro} ${complemento} ${bairro}`
    div.appendChild(p1)

    const p2 = document.createElement('p')
    p2.innerText = `${localidade} - ${uf}, ${cep}`
    div.appendChild(p2)

    field.appendChild(div)
  },

  set_option: function(selectField, value, text){
    const option = document.createElement('option')

    if(!selectField.hasChildNodes()){
      option.value = ""
      option.disabled = true
      option.selected = true
      option.textContent = '--- Selecione ---'
    } else {
      option.value = `${value}`
      option.textContent = `${text}`
    }
    selectField.appendChild(option)
  },

  clear_options: function(selectField){
    while(selectField.hasChildNodes()){
      selectField.removeChild(selectField.firstChild)
    }
    this.set_option(selectField)
  },

  clear_input: function(inputField){
    inputField.value = ''
    this.set_message(inputField, '')
  },

  clear_address_input_mode_select_field: function(){
    this.$input_mode.forEach(radio => radio.checked = false)
  },

  clear_address_input_by_zip_code_field: function(){
    this.clear_input(this.$zip_code)
    this.set_message(this.$zip_code, '')
  },

  clear_address_input_by_address_selection_field: function(){
    const elements = this.$address_input_by_address_selection.elements

    for(elt of elements){
      if(elt.localName == 'input'){
        this.clear_input(elt)
      }
      else if(elt.localName == 'select'){
        this.clear_options(elt)
      }
      else if(elt.localName == 'button' && elt.type == 'submit'){
        this.disable_button(elt)
      }
      this.set_message(elt, '')
    }
  },

  clear_register_address_confirmation_field: function(){
    this.$register_address_confirmation.innerHTML = '<legend>Confirmar Endereço</legend>'
  },

  set_message:function(fieldRow, message, messageType){
    const messageField = fieldRow.parentElement.nextElementSibling
    messageField.innerText = `${message}`
    messageField.classList.remove(...messageField.classList)

    messageField.classList.add('message')
    if(messageType){
      messageField.classList.add(messageType)
    }
  },

  set_initial_visibility: function(){
    const elementsToHide = [
      this.$address_input_mode_select,
      this.$address_input_by_zip_code, 
      this.$address_input_by_address_selection,
      this.$register_address_confirmation,
      this.$action_buttons,
      this.$register_address_form
    ]
    const elementsToShow = [
      this.$user_address
    ]

    this.clear_address_input_mode_select_field()
    this.clear_address_input_by_zip_code_field()
    this.clear_address_input_by_address_selection_field()
    this.clear_register_address_confirmation_field()
    this.$btn_submit_address.disabled = true

    this.display_none(elementsToHide)
    this.display_block(elementsToShow)
  },
  display_none: function(elements){
    for(element of elements){
      element.style.display = 'none'
    }
  },
  display_block: function(elements){
    for(element of elements){
      element.style.display = 'block'
    }
  },
  display_flex: function(elements){
    for(element of elements){
      element.style.display = 'flex'
    }
  },
  check_response_error: function(response){
    if(response.erro){
      throw Error(this.Message.not_found)
    }else{
      return response
    }
  },

  Validate:{
    city_field: function(value){
      const city = value.replace(/\s/g,'')
      const regexCity = /^[0-9a-zA-ZÀ-ÿ]{3,}$/g
      return regexCity.test(city)
    },
    district_field: function(value){
      const district = value.replace(/\s/g,'')
      const regexDistrict = /^[0-9a-zA-ZÀ-ÿ]{3,}$/g
      return regexDistrict.test(district)
    },
    state_field: function(value){
      const state = value.replace(/\s/g,'')
      const regexState = /^[a-zA-Z]{2}$/g
      return regexState.test(state)
    },
    street_field: function(value){
      const street = value.replace(/\s/g,'')
      const regexStreet = /^[0-9a-zA-ZÀ-ÿ]{3,}$/g
      return regexStreet.test(street)
    },
    zip_code_field: function(value){
      const zipCode = value.replace(/\s/g,'')
      const regexZipCode = /^[0-9]{8}$/g
      return regexZipCode.test(zipCode)
    },
  },

  Message:{
    not_found: 'Não encontrado',
    field_required: 'Campo obrigatório',
    field_incorrect: 'Preencha corretamente o campo',
    field_correct: 'Ok!',

    Type:{
      success: 'success',
      warning: 'warning',
      danger: 'danger',
    }
  },
}

Register_address.init()