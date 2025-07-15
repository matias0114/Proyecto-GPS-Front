import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiasDespachoComponent } from './guias-despacho.component';

describe('GuiasDespachoComponent', () => {
  let component: GuiasDespachoComponent;
  let fixture: ComponentFixture<GuiasDespachoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GuiasDespachoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuiasDespachoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
