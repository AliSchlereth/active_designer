function destroyTable(){
  if (openEditChecker()) { return };
  $('.delete-table').unbind('click');
  $('.delete-table').click(function() {
    $(this).popover('dispose');
    let card = $(this).parents('.card');
    let listItems = card.find('.list-group-item');
    for(let i = 0; i < listItems.length; i++) {
      jsPlumb.remove(listItems[i]);
    };
    card[0].outerHTML = "";
  });
}

function destroyColumn() {
  let schema = getSchema();
  if (openEditChecker()) { return }
  $('.delete-column').unbind('click')
  $('.delete-column').click(function() {
    $(this).popover('dispose');
    let column = $(this).parents("div[id^='col-']")[0];
    let columnID = column.id;
    let card = $(this).parents(".card")[0];
    jsPlumb.remove(column)
    jsPlumb.recalculateOffsets(card)
    let tableID = `tbl-${columnID.split('-')[1]}`;
    let columns = schema[tableID].columns
    let status = columns[columnID].status;
    if (status.new) {
      columns[columnID] = undefined;
    } else {
      status.deleted = true
    }
  });
  setSchema(schema);
}

function destroyReference() {
  if (openEditChecker()) { return };
  let schema = getSchema();
  $('.delete-ref').unbind('click')
  $('.delete-ref').click(function() {
    $(this).popover('dispose');
    let reference = $(this).parents("div[id^='ref-']")[0];
    let referenceID = reference.id;
    let tableID = `tbl-${referenceID.split('-')[1]}`;
    let card = $(this).parents(".card")[0];
    jsPlumb.remove(reference);
    jsPlumb.recalculateOffsets(card)
    let references = schema[tableID].references
    let status = references[referenceID].status;
    if (status.new) {
      references[referenceID] = undefined;
    } else {
      status.deleted = true
    }
  });
  setSchema(schema);
}

function newColumnObj(tableID, columnName, columnType, schema) {
  let tableNum = tableID.split('-')[1];
  let prevID = 100;
  let columnIDs = Object.keys(schema[`tbl-${tableNum}`].columns);
  if (columnIDs.length !== 0) {
    prevID = parseInt(columnIDs[columnIDs.length -1].split('-')[2]);
  }
  let columnID = `col-${tableNum}-${prevID + 1}`;
  return schema[tableID].columns[columnID] = {
    name: columnName,
    original_name: null,
    type: columnType,
    original_type: null,
    id: columnID,
    status: { original: false, modified: false, new: true }
  }
}

function newRefObj(tableID,foreignTableName,foreignTableID, schema)  {
  let tableNum = tableID.split('-')[1];
  let prevID = 100;
  let columnIDs = Object.keys(schema[`tbl-${tableNum}`].references);
  if (columnIDs.length !== 0) {
    prevID = parseInt(columnIDs[columnIDs.length -1].split('-')[2]);
  }
  let columnID = `col-${tableNum}-${prevID + 1}`;
  return schema[tableID].references[columnID] = {
    id: columnID,
    table_id: tableID,
    foreign_table_name: foreignTableName,
    foreign_table_id: foreignTableID,
    status: { original: false, new: true, deleted: false}
  }
}

function addColumnDisplay() {
  if (openEditChecker()) { return };
  $('.fa-plus-square').unbind('click');
  $('.fa-plus-square').on('click', null, {}, displayColumnJumbo);
}

function refColToggle() {
  $('#column-reference').change(function(){
    if (this.checked) {
      $('.add-column-card').find('.column-html').addClass('hidden')
      $('.add-column-card').find('.reference-html').removeClass('hidden')
    } else if (!this.checked) {
      $('.add-column-card').find('.reference-html').addClass('hidden')
      $('.add-column-card').find('.column-html').removeClass('hidden')
    }
  });
}

function displayColumnJumboExit() {
  $('.add-column-card .fa-times').click(function() {
    $('.add-column-card')[0].outerHTML = ""
  });
}

function createNewRef(schema,card) {
  let foreignTableName = $('form input#foreign-table-name').val()
  let cardIDs = Object.keys(schema)
  for(let i = 0; i < cardIDs.length; i++) {
    if (schema[cardIDs[i]].name === foreignTableName) {
      let referenceRelationship = $('input[name="ref-rel"]:checked').val()
      let foreignTableHTML = $(`#${cardIDs[i]}`);

      let prevRefs = schema[card[0].id].references
      let prevRefKeys = Object.keys(prevRefs)
      let prevStatus = false
      for(let i = 0; i < prevRefKeys.length; i++) {
        if (prevRefs[prevRefKeys[i]].foreign_table_name === foreignTableName) {
          prevStatus = true
        }
      }
      if (!prevStatus) {
        let foreignKeyHTML = foreignTableHTML.find(`#${foreignTableHTML[0].id}-id-column`);
        let listGroup = card.find('.list-group');
        let refObj = newRefObj(card[0].id, foreignTableName, foreignTableHTML[0].id, schema);
        listGroup.append(columnHTML({id: refObj.id, type: "integer", name: `${foreignTableName}_id`},"delete-ref"));
        let newColumnHTML = $(`#${refObj.id}`)[0]
        // debugger
        createConnector(newColumnHTML,foreignKeyHTML);
      }
      else {
        console.log("already happend")
      }
    }
  }
}

function displayColumnJumbo() {
  $('body').append(addColumnCardHTML());
  let card = $(this).parents('.card');

  refColToggle()
  displayColumnJumboExit()
  $('form button').click(function() {
    let schema = getSchema();
    let referenceChecked = $('form input#column-reference')[0].checked
    if (referenceChecked) {
      createNewRef(schema,card)
    } else {
      let columnName = $('form input#column-name').val()
      let columnType = $('form select#column-type-select').val()
      let listGroup = card.find('.list-group');
      let columnObj = newColumnObj(card[0].id, columnName, columnType, schema)
      listGroup.append(columnHTML(columnObj, "delete-column"));
    }
    setSchema(schema);
    $('.add-column-card')[0].outerHTML = ""
    destroyColumn()
    destroyReference()
    return false
  })

  $('[data-toggle="popover"]').popover();
}

function addColumnCardHTML() {
  return "<div class='card add-column-card'>" +
    "<div class='card-header'>" +
      "<h4 class='card-title'>Enter Column Information</h4>" +
      "<i class='fa fa-times' aria-hidden='true'></i>" +
    "</div>" +
    "<div class='card-block'>" +
    "<form>" +
      "<div class='ref-check'>" +
        "<label class='ref-check-label'>" +
          "<input class='ref-check-input' type='checkbox' id='column-reference' value='reference' > reference" +
        "</label>" +
      "</div>" +
      datatypeSelectoHTML() +
      foreignTableRadioButtonHTML() +
      "<div class='form-group'>" +
        "<button type='submit' class='btn btn-primary'>Submit</button>" +
      "</div>" +
    "</form>" +
  "</div>" +
  "</div>"
}

function foreignTableRadioButtonHTML() {
  return "<div class='reference-html hidden'>" +
    "<div class='form-group'>" +
      "<input type='text' class='form-control' id='foreign-table-name' placeholder='foreign table name'>" +
    "</div>" +
    "<div class='form-check'>" +
      "<label class='form-check-label'>" +
        "<input class='form-check-input' type='radio' name='ref-rel' id='ref-rel-mto' value='mto'>" +
        " Many to one reference" +
      "</label>" +
    "</div>" +
    "<div class='form-check'>" +
      "<label class='form-check-label'>" +
        "<input class='form-check-input' type='radio' name='ref-rel' id='ref-rel-mto' value='mtm'>" +
        " Many to many reference" +
      "</label>" +
    "</div>" +
  "</div>"
}

function datatypeSelectoHTML() {
  return "<div class='column-html'>" +
    "<div class='form-group'>" +
      "<input type='text' class='form-control' id='column-name' placeholder='column name'>" +
    "</div>" +
    "<div class='form-group'>" +
      "<label for='column-type-select'>Column Type</label>" +
      "<select id='column-type-select'>" +
        "<option selected>select</option>" +
        "<option value='character'>CHARACTER(n)</option>" +
        "<option value='varchar'>VARCHAR(n)</option>" +
        "<option value='binary'>BINARY(n)</option>" +
        "<option value='boolean'>BOOLEAN</option>" +
        "<option value='varbinary'>VARBINARY(n)</option>" +
        "<option value='integer-precision'>INTEGER(p)</option>" +
        "<option value='smallint'>SMALLINT</option>" +
        "<option value='integer'>INTEGER</option>" +
        "<option value='bigint'>BIGINT</option>" +
        "<option value='decimal'>DECIMAL(p,s)</option>" +
        "<option value='numeric'>NUMERIC(p,s)</option>" +
        "<option value='float'>FLOAT(p)</option>" +
        "<option value='real'>REAL</option>" +
        "<option value='float'>FLOAT</option>" +
        "<option value='date'>DATE</option>" +
        "<option value='time'>TIME</option>" +
        "<option value='timestamp'>TIMESTAMP</option>" +
        "<option value='interval'>INTERVAL</option>" +
        "<option value='array'>ARRAY</option>" +
        "<option value='multiset'>MULTISET</option>" +
        "<option value='xml'>XML</option>" +
      "</select>" +
    "</div>" +
  "</div>"
}

function addListeners(){
  destroyTable()
  editTableName()
  addColumnDisplay()
  destroyColumn()
  destroyReference()
  $('[data-toggle="popover"]').popover()
}
